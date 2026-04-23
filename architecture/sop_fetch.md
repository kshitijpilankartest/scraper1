# SOP-001: Fetch RSS & Reddit Feeds
> Layer 1 — Architecture | Version 1.0 | 2026-04-13

## Goal
Fetch RSS XML from Ben's Bites and The AI Rundown, and JSON from Reddit, using browser-native APIs. Cache results for 24h to avoid repeat fetches.

## Inputs
- List of feed configs `{ name, url, type: "rss"|"reddit", color }`
- Current `scarper_last_fetched` timestamp from localStorage

## Logic
1. Check if `Date.now() - last_fetched < 24h`. If true → **skip fetch, use cache**.
2. For each RSS feed:
   - Request via `allorigins.win` proxy: `https://api.allorigins.win/get?url={encodeURIComponent(feedUrl)}`
   - Parse response `.contents` as XML using `DOMParser`
   - Extract `<item>` nodes → pass to Parser (SOP-002)
3. For each Reddit feed:
   - Fetch `https://www.reddit.com/r/{sub}/new.json?limit=25` directly (no CORS issue)
   - Set header `User-Agent: Scarper/1.0`
   - Extract `data.children[].data` → pass to Parser (SOP-002)
4. Merge all articles, deduplicate by URL hash
5. Save to localStorage (SOP-003)
6. Update `scarper_last_fetched` to `Date.now()`

## Error Handling
- If fetch fails: log to console, return cached articles if available
- If XML parse fails: log error, skip that source
- If allorigins returns non-XML: validate `contents` starts with `<?xml` before parsing

## Rate Limiting
- MAX 1 fetch cycle per 24h (enforced by timestamp check)
- Manual refresh button available to override timestamp
