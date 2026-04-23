// renderer.js — Layer 3: DOM Rendering Tool
// Brand-aligned: Deep navy + lime green (#C8F53F) color system

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
}

// Source display config
const SOURCE_CONFIG = {
  "Ben's Bites":        { short: 'BB',  color: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  border: 'rgba(255,107,53,0.22)' },
  "The AI Rundown":     { short: 'AIR', color: '#9B79FF', bg: 'rgba(155,121,255,0.1)', border: 'rgba(155,121,255,0.22)' },
  "Reddit":             { short: 'RDT', color: '#FF5722', bg: 'rgba(255,87,34,0.1)',   border: 'rgba(255,87,34,0.22)' },
};

function getSourceConfig(source) {
  if (source.includes("Ben"))    return SOURCE_CONFIG["Ben's Bites"];
  if (source.includes("Rundown"))return SOURCE_CONFIG["The AI Rundown"];
  if (source.includes("Reddit")) return SOURCE_CONFIG["Reddit"];
  return { short: source.slice(0,3).toUpperCase(), color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' };
}

function createArticleCard(article) {
  const card = document.createElement('article');
  const src = getSourceConfig(article.source);

  // Read persisted like/downvote state from localStorage
  const likedIds    = JSON.parse(localStorage.getItem('scarper_liked_ids')     || '[]');
  const downvotedIds = JSON.parse(localStorage.getItem('scarper_downvoted_ids') || '[]');
  const isLiked     = likedIds.includes(article.id);
  const isDownvoted = downvotedIds.includes(article.id);

  card.className = `card${article.is_saved ? ' saved' : ''}${article.is_new ? ' is-new' : ''}`;
  card.dataset.id = article.id;
  card.style.setProperty('--card-accent', src.color);

  card.innerHTML = `
    ${article.thumbnailUrl ? `
    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="card-image-wrap" aria-hidden="true" tabindex="-1">
      <div class="skeleton"></div>
      <img class="card-image hidden" src="${article.thumbnailUrl}" alt="" loading="lazy" 
           onload="this.classList.remove('hidden'); this.previousElementSibling?.remove();" 
           onerror="this.parentElement.remove();" />
    </a>
    ` : ''}
    <div class="card-content">
      <div class="card-header">
        <span class="source-badge" style="color:${src.color};background:${src.bg};border:1px solid ${src.border}">
          ${src.short}
        </span>
        ${article.is_new ? '<span class="new-badge">NEW</span>' : ''}
        <span class="time-ago">${timeAgo(article.published_at)}</span>
        <button class="save-btn ${article.is_saved ? 'active' : ''}"
                data-id="${article.id}"
                title="${article.is_saved ? 'Unsave article' : 'Save article'}"
                aria-label="${article.is_saved ? 'Unsave' : 'Save'} article">
          <svg viewBox="0 0 24 24" fill="${article.is_saved ? 'currentColor' : 'none'}"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      <h3 class="card-title">
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
      </h3>
      <p class="card-summary">${article.summary}</p>
      <div class="card-footer">
        <span class="source-full">${article.source}</span>
        <div class="card-actions">
          <button class="action-btn like-btn ${isLiked ? 'active' : ''}"
                  data-id="${article.id}"
                  title="${isLiked ? 'Unlike' : 'Like this article'}"
                  aria-label="${isLiked ? 'Unlike' : 'Like'} article"
                  aria-pressed="${isLiked}">
            <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}"
                 stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="action-count" id="like-count-${article.id}">0</span>
          </button>
          <button class="action-btn downvote-btn ${isDownvoted ? 'active' : ''}"
                  data-id="${article.id}"
                  title="${isDownvoted ? 'Remove downvote' : 'Not interested'}"
                  aria-label="${isDownvoted ? 'Remove downvote from' : 'Downvote'} article"
                  aria-pressed="${isDownvoted}">
            <svg viewBox="0 0 24 24" fill="${isDownvoted ? 'currentColor' : 'none'}"
                 stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
            </svg>
            <span class="action-count" id="dislike-count-${article.id}">0</span>
          </button>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-link" aria-label="Read full article">
            Read article →
          </a>
        </div>
      </div>
    </div>
  `;

  return card;
}

export const Renderer = {
  renderStats(articles) {
    const total      = articles.length;
    const newCount   = articles.filter(a => a.is_new).length;
    const savedCount = articles.filter(a => a.is_saved).length;
    const sources    = [...new Set(articles.map(a => a.source))].length;

    // Liked and downvoted counts are now globally synced via Firebase and populated in app.js
    // We establish their containers here with initial zero/loading state.
    const likedCount = window.globalFirebaseLikes || 0;
    const downvotedCount = window.globalFirebaseDislikes || 0;

    const el = document.getElementById('stats');
    if (!el) return;

    el.innerHTML = `
      <button class="stat" role="listitem" data-filter="all">
        <div class="stat-label">Total Articles</div>
        <div class="stat-row">
          <span class="stat-num">${total}</span>
          <span class="stat-icon">📰</span>
        </div>
      </button>
      <button class="stat accent" role="listitem" data-filter="new">
        <div class="stat-label">New (Last 24h)</div>
        <div class="stat-row">
          <span class="stat-num">${newCount}</span>
          <span class="stat-icon">⚡</span>
        </div>
      </button>
      <button class="stat" role="listitem" data-filter="saved">
        <div class="stat-label">Saved</div>
        <div class="stat-row">
          <span class="stat-num">${savedCount}</span>
          <span class="stat-icon">🔖</span>
        </div>
      </button>
      <button class="stat" role="listitem" data-filter="sources">
        <div class="stat-label">Sources</div>
        <div class="stat-row">
          <span class="stat-num">${sources}</span>
          <span class="stat-icon">🌐</span>
        </div>
      </button>
      <button class="stat" role="listitem" data-filter="liked">
        <div class="stat-label">Liked</div>
        <div class="stat-row">
          <span class="stat-num" id="global-liked-count">${likedCount}</span>
          <span class="stat-icon">❤️</span>
        </div>
      </button>
      <button class="stat" role="listitem" data-filter="disliked">
        <div class="stat-label">Disliked</div>
        <div class="stat-row">
          <span class="stat-num" id="global-disliked-count">${downvotedCount}</span>
          <span class="stat-icon">👎</span>
        </div>
      </button>
    `;
  },

  renderArticles(articles, filter = 'all', searchQuery = '') {
    const grid  = document.getElementById('articles-grid');
    const empty = document.getElementById('empty-state');
    if (!grid) return;

    // STRICT FILTER: Exclude any article without an image
    let filtered = articles.filter(a => !!a.thumbnailUrl);

    if (Array.isArray(filter) && filter.length > 0) {
      filtered = filtered.filter(a => {
        return filter.some(id => {
          if (id === 'bensbites') return a.source.includes("Ben");
          if (id === 'rundown')   return a.source.includes("Rundown");
          if (id === 'reddit')    return a.source.includes("Reddit");
          // Add custom logic for demo agents if needed
          return false;
        });
      });
    } else {
      if (filter === 'new')       filtered = filtered.filter(a => a.is_new);
      if (filter === 'saved')     filtered = filtered.filter(a => a.is_saved);
      if (filter === 'bensbites') filtered = filtered.filter(a => a.source.includes("Ben"));
      if (filter === 'rundown')   filtered = filtered.filter(a => a.source.includes("Rundown"));
      if (filter === 'reddit')    filtered = filtered.filter(a => a.source.includes("Reddit"));
      if (filter === 'liked') {
        const likedIds = JSON.parse(localStorage.getItem('scarper_liked_ids') || '[]');
        filtered = filtered.filter(a => likedIds.includes(a.id));
      }
      if (filter === 'disliked') {
        const downvotedIds = JSON.parse(localStorage.getItem('scarper_downvoted_ids') || '[]');
        filtered = filtered.filter(a => downvotedIds.includes(a.id));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }

    grid.innerHTML = '';

    if (filtered.length === 0) {
      if (empty) empty.style.display = 'flex';
      return;
    }

    if (empty) empty.style.display = 'none';

    const fragment = document.createDocumentFragment();
    filtered.forEach(article => fragment.appendChild(createArticleCard(article)));
    grid.appendChild(fragment);
  },

  setLoading(isLoading, message = 'Fetching latest articles…') {
    const overlay = document.getElementById('loading-overlay');
    const msg     = document.getElementById('loading-message');
    if (!overlay) return;
    overlay.style.display = isLoading ? 'flex' : 'none';
    if (msg && message) msg.textContent = message;
  },

  updateProgress(completed, total) {
    const bar = document.getElementById('progress-bar');
    const pct = Math.round((completed / total) * 100);
    if (bar) bar.style.width = `${pct}%`;
    const msg = document.getElementById('loading-message');
    if (msg) msg.textContent = `Fetching feeds… ${completed}/${total}`;
  },

  setLastUpdated(date) {
    const el = document.getElementById('last-updated');
    if (!el) return;
    el.textContent = date
      ? `Last updated: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Never fetched';
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.className = 'toast'; }, 3200);
  },

  highlightActiveFilter(filterId) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const isActive = btn.dataset.filter === filterId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    document.querySelectorAll('.stat').forEach(stat => {
      const isActive = stat.dataset.filter === filterId;
      stat.classList.toggle('active', isActive);
      stat.setAttribute('aria-pressed', isActive);
    });
  },
};
