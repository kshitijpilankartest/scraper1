// parser.js — Layer 3: Atomic RSS/Reddit Parser
// SOP Reference: architecture/sop_parse.md

const SOURCE_COLORS = {
  "Ben's Bites": '#f97316',      // Orange
  'The AI Rundown': '#8b5cf6',   // Purple
  'Reddit': '#ef4444',           // Red
};

// djb2 hash — deterministic ID from URL string
function hashId(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function summarize(text, maxLen = 220) {
  const clean = stripHtml(text);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s\S*$/, '') + '…';
}

function isWithin24h(dateStr) {
  try {
    const published = new Date(dateStr).getTime();
    return (Date.now() - published) < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

async function fetchOpenGraphImage(url) {
  try {
    const PROXY_URL = 'http://localhost:3501/?url=';
    const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return '';
    
    const htmlText = await response.text();
    
    const ogImageMatch = htmlText.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const imageUrl = ogImageMatch[1];
      return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&fit=cover`;
    }
    return '';
  } catch (err) {
    console.warn(`[OG Scraper] Failed to fetch standard og:image for ${url} - ${err.message}`);
    return '';
  }
}

export const Parser = {
  parseRSSItems(xmlDoc, sourceName) {
    const items = Array.from(xmlDoc.querySelectorAll('item'));
    const now = new Date().toISOString();
    const color = SOURCE_COLORS[sourceName] || '#6b7280';

    return items.map(item => {
      let url = '';
      const linkEl = item.querySelector('link');
      if (linkEl) {
        url = linkEl.getAttribute('href') || linkEl.textContent?.trim() || '';
      }
      if (!url) {
        url = item.querySelector('guid')?.textContent?.trim() || '';
      }

      if (!url) return null;

      const pubDateRaw = item.querySelector('pubDate')?.textContent?.trim() || '';
      let published_at;
      try {
        published_at = pubDateRaw ? new Date(pubDateRaw).toISOString() : now;
      } catch {
        published_at = now;
      }

      const rawDescription =
        item.querySelector('description')?.textContent || '';

      return {
        id: hashId(url),
        source: sourceName,
        source_color: color,
        title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
        summary: summarize(rawDescription),
        url,
        published_at,
        fetched_at: now,
        is_new: isWithin24h(published_at),
        is_saved: false,
        thumbnailUrl: '', // Will be populated dynamically by fetcher
      };
    }).filter(Boolean);
  },

  parseRedditItems(jsonData, sourceName) {
    const children = jsonData?.data?.children || [];
    const now = new Date().toISOString();
    const color = SOURCE_COLORS['Reddit'];

    return children.map(({ data }) => {
      const url = data?.url || data?.permalink
        ? `https://reddit.com${data.permalink}`
        : '';

      if (!url) return null;

      const published_at = data.created_utc
        ? new Date(data.created_utc * 1000).toISOString()
        : now;

      const rawSummary = data.selftext
        ? data.selftext
        : '[Link Post]';

      let thumbnailUrl = '';
      const previewImg = data.preview?.images?.[0]?.source?.url;
      if (previewImg) {
        thumbnailUrl = previewImg.replace(/&amp;/g, '&');
        thumbnailUrl = `https://wsrv.nl/?url=${encodeURIComponent(thumbnailUrl)}&w=800&fit=cover`;
      } else if (data.thumbnail && data.thumbnail.startsWith('http')) {
        thumbnailUrl = `https://wsrv.nl/?url=${encodeURIComponent(data.thumbnail)}&w=800&fit=cover`;
      }

      return {
        id: hashId(url),
        source: sourceName,
        source_color: color,
        title: data.title?.trim() || 'Untitled',
        summary: summarize(rawSummary),
        url: data.url || `https://reddit.com${data.permalink}`,
        published_at,
        fetched_at: now,
        is_new: isWithin24h(published_at),
        is_saved: false,
        thumbnailUrl,
      };
    }).filter(Boolean);
  },
  
  fetchOpenGraphImage,
};
