import { Parser } from './parser.js';
import { Storage } from './storage.js';
import { Fetcher } from './fetcher.js';
import { Renderer } from './renderer.js';
import { MemberSelector } from './memberSelector.js';
import { db, doc, setDoc, increment, collection, onSnapshot } from './firebaseSetup.js';

let allArticles = [];
let currentFilter = 'all';
let searchQuery = '';
let autoRefreshTimer = null;
let ms = null;

// ─── Boot ────────────────────────────────────────────────────────────────────

async function boot() {
  // 1. Load cached articles immediately — gives instant content
  allArticles = Storage.getArticles();
  const lastFetched = Storage.getLastFetched();

  Renderer.setLastUpdated(lastFetched);
  Renderer.renderStats(allArticles);
  Renderer.highlightActiveFilter(currentFilter);
  Renderer.renderArticles(allArticles, currentFilter, searchQuery);

  // Initialize Member Selector
  ms = new MemberSelector('member-selector-root', (selectedIds) => {
    if (selectedIds.length > 0) {
      currentFilter = selectedIds; // Passing array to Renderer
      Renderer.highlightActiveFilter(null); // Clear pill highlights
    } else {
      currentFilter = 'all';
      Renderer.highlightActiveFilter('all');
    }
    Renderer.renderArticles(allArticles, currentFilter, searchQuery);
  });

  // 2. Fetch if needed (24h rule)
  if (Storage.shouldFetch()) {
    await runFetch();
  }

  // 3. Schedule next auto-refresh at midnight-ish (check every hour)
  scheduleAutoRefresh();
}

// ─── Fetch Cycle ─────────────────────────────────────────────────────────────

async function runFetch() {
  Renderer.setLoading(true);
  Renderer.showToast('Fetching latest articles…', 'info');

  try {
    const { articles, errors } = await Fetcher.fetchAll((done, total) => {
      Renderer.updateProgress(done, total);
    });

    if (articles.length > 0) {
      // 1. Check which articles are completely new OR missing thumbnails
      const existingArticles = Storage.getArticles();
      const existingIds = new Set(existingArticles.map(a => a.id));
      const newlyFetched = articles.filter(a => !existingIds.has(a.id));
      const needsThumbnail = articles.filter(a => !a.thumbnailUrl && existingIds.has(a.id));
      const allToProcess = [...newlyFetched, ...needsThumbnail];

      // 2. Fetch OG Images
      if (allToProcess.length > 0) {
        Renderer.showToast(`Extracting thumbnails for ${allToProcess.length} articles…`, 'info');
        const ogPromises = allToProcess.map(async (article) => {
          if (!article.thumbnailUrl && article.url.startsWith('http')) {
             article.thumbnailUrl = await Parser.fetchOpenGraphImage(article.url);
          }
        });
        await Promise.allSettled(ogPromises);
      }

      // 3. Save purely locally
      allArticles = Storage.saveArticles(articles);
      Storage.setLastFetched();
      
      // 4. Fire-and-forget sync the newly fetched articles to Firestore
      newlyFetched.forEach(article => {
        // Run asynchronously, ignore await to not block UI
        setDoc(doc(db, 'articles', article.id), { ...article }, { merge: true })
          .catch(e => console.warn(`Failed to sync article ${article.id} to Firestore`, e));
      });

      const newCount = allArticles.filter(a => a.is_new).length;
      Renderer.renderStats(allArticles);
      Renderer.highlightActiveFilter(currentFilter);
      Renderer.renderArticles(allArticles, currentFilter, searchQuery);
      Renderer.setLastUpdated(new Date());
      Renderer.showToast(
        newCount > 0
          ? `✨ Found ${newCount} new articles!`
          : 'No new articles in the last 24h.',
        newCount > 0 ? 'success' : 'info'
      );
    } else {
      Renderer.showToast('Could not fetch new articles. Showing cached.', 'warn');
    }

    if (errors.length > 0) {
      console.warn('[Scarper] Fetch errors:', errors);
    }
  } catch (err) {
    console.error('[Scarper] Fatal fetch error:', err);
    Renderer.showToast('Fetch failed. Showing cached articles.', 'error');
  } finally {
    Renderer.setLoading(false);
  }
}

// ─── Auto-Refresh ─────────────────────────────────────────────────────────────

function scheduleAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  // Check every hour — runFetch respects the 24h gate internally
  autoRefreshTimer = setInterval(() => {
    if (Storage.shouldFetch()) runFetch();
  }, 60 * 60 * 1000);
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

function wireEvents() {
  // ── Sidebar Nav ──────────────────────────────────────────────────────────────
  // Shared helper: sets one nav item as active and resets others
  function setActiveNav(activeId) {
    document.querySelectorAll('.nav-item').forEach(n => {
      const isActive = n.id === activeId;
      n.classList.toggle('active', isActive);
      n.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  // Nav 1 — Feed: show all articles
  const navFeed = document.getElementById('nav-feed');
  if (navFeed) {
    navFeed.addEventListener('click', () => {
      currentFilter = 'all';
      searchQuery = '';
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = '';
      Renderer.highlightActiveFilter('all');
      Renderer.renderArticles(allArticles, 'all', '');
      setActiveNav('nav-feed');
    });
  }

  // Nav 2 — Saved: filter to saved articles
  const navSaved = document.getElementById('nav-saved');
  if (navSaved) {
    navSaved.addEventListener('click', () => {
      currentFilter = 'saved';
      Renderer.highlightActiveFilter('saved');
      Renderer.renderArticles(allArticles, 'saved', searchQuery);
      setActiveNav('nav-saved');
    });
  }

  // Nav 3 — Sources: cycle through source filters with a tooltip toast
  const navSources = document.getElementById('nav-sources');
  if (navSources) {
    const sourceFilters = ['all', 'bensbites', 'rundown', 'reddit'];
    const sourceLabels  = ['All Sources', "Ben's Bites", 'AI Rundown', 'Reddit'];
    let sourceIndex = 0;
    navSources.addEventListener('click', () => {
      sourceIndex = (sourceIndex + 1) % sourceFilters.length;
      const filter = sourceFilters[sourceIndex];
      const label  = sourceLabels[sourceIndex];
      currentFilter = filter;
      Renderer.highlightActiveFilter(filter);
      Renderer.renderArticles(allArticles, filter, searchQuery);
      setActiveNav('nav-sources');
      if (filter === 'all') setActiveNav('nav-feed');
      Renderer.showToast(`🌐 Showing: ${label}`, 'info');
    });
  }

  // Filter buttons (pills)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      Renderer.highlightActiveFilter(currentFilter);
      Renderer.renderArticles(allArticles, currentFilter, searchQuery);
    });
  });

  // KPI Stat cards click to filter
  const statsWrap = document.getElementById('stats');
  if (statsWrap) {
    statsWrap.addEventListener('click', (e) => {
      const statBtn = e.target.closest('.stat');
      if (!statBtn) return;
      const filter = statBtn.dataset.filter;
      if (filter && filter !== 'sources') {
        currentFilter = filter;
        Renderer.highlightActiveFilter(filter);
        Renderer.renderArticles(allArticles, filter, searchQuery);
        
        // Match sidebar state if it aligns
        if (filter === 'all') setActiveNav('nav-feed');
        if (filter === 'saved') setActiveNav('nav-saved');
        Renderer.showToast(`📊 Filtered to: ${statBtn.querySelector('.stat-label').textContent}`, 'info');
      } else if (filter === 'sources') {
        // Just trigger click on the sources nav btn
        const navSources = document.getElementById('nav-sources');
        if (navSources) navSources.click();
      }
    });
  }

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      Renderer.renderArticles(allArticles, currentFilter, searchQuery);
    });
  }

  // Manual refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      Storage.setLastFetched(new Date(0)); // Force fetch
      await runFetch();
    });
  }

  // Grid interactions — save, like, downvote via event delegation
  const grid = document.getElementById('articles-grid');
  if (grid) {
    grid.addEventListener('click', (e) => {

      // ── Save / Unsave ─────────────────────────────────────────────
      const saveBtn = e.target.closest('.save-btn');
      if (saveBtn) {
        const id = saveBtn.dataset.id;
        const article = allArticles.find(a => a.id === id);
        if (!article) return;
        const newSaved = !article.is_saved;
        allArticles = Storage.setSaved(id, newSaved);
        const card = document.querySelector(`.card[data-id="${id}"]`);
        if (card) {
          card.classList.toggle('saved', newSaved);
          saveBtn.classList.toggle('active', newSaved);
          saveBtn.querySelector('svg').setAttribute('fill', newSaved ? 'currentColor' : 'none');
          saveBtn.title = newSaved ? 'Unsave article' : 'Save article';
        }
        Renderer.renderStats(allArticles);
        Renderer.showToast(newSaved ? '🔖 Article saved!' : 'Article unsaved.', newSaved ? 'success' : 'info');
        return;
      }

      // ── Like ──────────────────────────────────────────────────────
      const likeBtn = e.target.closest('.like-btn');
      if (likeBtn) {
        const id = likeBtn.dataset.id;
        const liked = likeBtn.classList.toggle('active');
        
        // Persist to localStorage for local user state purely
        const likedIds = JSON.parse(localStorage.getItem('scarper_liked_ids') || '[]');
        const updated = liked
          ? [...new Set([...likedIds, id])]
          : likedIds.filter(x => x !== id);
        localStorage.setItem('scarper_liked_ids', JSON.stringify(updated));
        
        // Firebase sync
        const articleRef = doc(db, 'articles', id);
        setDoc(articleRef, {
          likesCount: increment(liked ? 1 : -1)
        }, { merge: true }).catch(err => console.error("Firebase update failed", err));

        Renderer.showToast(liked ? '❤️ Liked!' : 'Like removed.', liked ? 'success' : 'info');
        return;
      }

      // ── Downvote ─────────────────────────────────────────────────
      const downvoteBtn = e.target.closest('.downvote-btn');
      if (downvoteBtn) {
        const id = downvoteBtn.dataset.id;
        const downvoted = downvoteBtn.classList.toggle('active');
        
        const downvotedIds = JSON.parse(localStorage.getItem('scarper_downvoted_ids') || '[]');
        const updated = downvoted
          ? [...new Set([...downvotedIds, id])]
          : downvotedIds.filter(x => x !== id);
        localStorage.setItem('scarper_downvoted_ids', JSON.stringify(updated));
        
        // Firebase sync
        const articleRef = doc(db, 'articles', id);
        setDoc(articleRef, {
          dislikesCount: increment(downvoted ? 1 : -1)
        }, { merge: true }).catch(err => console.error("Firebase update failed", err));

        Renderer.showToast(downvoted ? '👎 Noted — fewer like this.' : 'Downvote removed.', 'info');
        return;
      }
    });
  }

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const saved = localStorage.getItem('scarper_theme') || 'dark';
    document.documentElement.dataset.theme = saved;
    themeBtn.textContent = saved === 'dark' ? '☀️' : '🌙';

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('scarper_theme', next);
      themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }
}

// ─── Firebase Sync ────────────────────────────────────────────────────────────

function setupFirebaseSync() {
  const articlesRef = collection(db, 'articles');
  onSnapshot(articlesRef, (snapshot) => {
    let globalLikes = 0;
    let globalDislikes = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const likes = data.likesCount || 0;
      const dislikes = data.dislikesCount || 0;
      
      globalLikes += likes;
      globalDislikes += dislikes;

      // Update Individual Article Cards directly within DOM
      const likeSpan = document.getElementById(`like-count-${docSnap.id}`);
      if (likeSpan) likeSpan.textContent = likes;

      const dislikeSpan = document.getElementById(`dislike-count-${docSnap.id}`);
      if (dislikeSpan) dislikeSpan.textContent = dislikes;
    });

    // Update Global Cache & KPI stats
    window.globalFirebaseLikes = globalLikes;
    window.globalFirebaseDislikes = globalDislikes;

    const kpiLike = document.getElementById('global-liked-count');
    if (kpiLike) kpiLike.textContent = globalLikes;

    const kpiDislike = document.getElementById('global-disliked-count');
    if (kpiDislike) kpiDislike.textContent = globalDislikes;
  }, (err) => {
    console.error("Firebase realtime sync error:", err);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupFirebaseSync();
  wireEvents();
  boot();
});
