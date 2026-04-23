// storage.js — Layer 3: Atomic localStorage Tool
// SOP Reference: architecture/sop_storage.md

const KEYS = {
  ARTICLES: 'scarper_articles',
  SAVED_IDS: 'scarper_saved_ids',
  LAST_FETCHED: 'scarper_last_fetched',
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`[Scarper Storage] Failed to read ${key}:`, e);
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[Scarper Storage] Failed to write ${key}:`, e);
    return false;
  }
}

export const Storage = {
  getArticles() {
    return safeRead(KEYS.ARTICLES, []);
  },

  getSavedIds() {
    return safeRead(KEYS.SAVED_IDS, []);
  },

  getLastFetched() {
    try {
      const val = localStorage.getItem(KEYS.LAST_FETCHED);
      return val ? new Date(val) : null;
    } catch {
      return null;
    }
  },

  // Merge new articles into existing, NEVER overwrite is_saved
  saveArticles(newArticles) {
    const existing = this.getArticles();
    const savedIds = new Set(this.getSavedIds());

    const existingMap = new Map(existing.map(a => [a.id, a]));

    for (const article of newArticles) {
      if (existingMap.has(article.id)) {
        // Preserve saved state
        const old = existingMap.get(article.id);
        existingMap.set(article.id, { ...article, is_saved: old.is_saved });
      } else {
        existingMap.set(article.id, {
          ...article,
          is_saved: savedIds.has(article.id),
        });
      }
    }

    const merged = Array.from(existingMap.values())
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    safeWrite(KEYS.ARTICLES, merged);
    return merged;
  },

  setLastFetched(date = new Date()) {
    try {
      localStorage.setItem(KEYS.LAST_FETCHED, date.toISOString());
    } catch (e) {
      console.warn('[Scarper Storage] Failed to set last_fetched:', e);
    }
  },

  setSaved(articleId, isSaved) {
    const ids = new Set(this.getSavedIds());
    if (isSaved) {
      ids.add(articleId);
    } else {
      ids.delete(articleId);
    }
    safeWrite(KEYS.SAVED_IDS, Array.from(ids));

    // Update article object
    const articles = this.getArticles();
    const updated = articles.map(a =>
      a.id === articleId ? { ...a, is_saved: isSaved } : a
    );
    safeWrite(KEYS.ARTICLES, updated);
    return updated;
  },

  shouldFetch() {
    const last = this.getLastFetched();
    if (!last) return true;
    const hoursSince = (Date.now() - last.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  },

  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
