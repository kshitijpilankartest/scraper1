// fetcher.js — Layer 3: Atomic Feed Fetcher
// SOP Reference: architecture/sop_fetch.md
// Requires: proxy.mjs running on port 3501 (node proxy.mjs)

import { Parser } from './parser.js';

const LOCAL_PROXY = 'http://localhost:3501/?url=';

async function fetchWithProxy(targetUrl) {
  const proxyUrl = `${LOCAL_PROXY}${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Proxy returned HTTP ${res.status} for ${targetUrl}`);
  return res.text();
}

const FEED_CONFIGS = [
  {
    name: "Ben's Bites",
    url: 'https://bensbites.substack.com/feed',
    type: 'rss',
  },
  {
    name: 'The AI Rundown',
    url: 'https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml',
    type: 'rss',
  },
  {
    name: 'Reddit — r/artificial',
    url: 'https://www.reddit.com/r/artificial/new.json?limit=25',
    type: 'reddit',
  },
  {
    name: 'Reddit — r/MachineLearning',
    url: 'https://www.reddit.com/r/MachineLearning/new.json?limit=25',
    type: 'reddit',
  },
];

async function fetchRSS(config) {
  const xmlText = await fetchWithProxy(config.url);

  if (!xmlText.trim().startsWith('<')) {
    throw new Error(`Invalid XML response for ${config.name}`);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) throw new Error(`XML parse error for ${config.name}`);

  return Parser.parseRSSItems(xmlDoc, config.name);
}

async function fetchReddit(config) {
  // Reddit JSON also needs a proxy on localhost
  const jsonText = await fetchWithProxy(config.url);
  const json = JSON.parse(jsonText);
  return Parser.parseRedditItems(json, 'Reddit');
}

export const Fetcher = {
  async fetchAll(onProgress) {
    const results = [];
    const errors = [];
    let completed = 0;

    const tasks = FEED_CONFIGS.map(async (config) => {
      try {
        let articles;
        if (config.type === 'rss') {
          articles = await fetchRSS(config);
        } else {
          articles = await fetchReddit(config);
        }
        results.push(...articles);
        console.log(`[Scarper] ✅ ${config.name}: ${articles.length} articles`);
      } catch (err) {
        console.error(`[Scarper] ❌ ${config.name}:`, err.message);
        errors.push({ source: config.name, error: err.message });
      } finally {
        completed++;
        if (onProgress) onProgress(completed, FEED_CONFIGS.length);
      }
    });

    await Promise.allSettled(tasks);

    return { articles: results, errors };
  },

  getFeedCount() {
    return FEED_CONFIGS.length;
  },
};
