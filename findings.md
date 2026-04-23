# 🔭 findings.md — Research, Discoveries & Constraints
> **Project:** Scarper | Last Updated: 2026-04-13

---

## 🔬 Research Log

| # | Topic | Finding | Impact |
|---|-------|---------|--------|
| 1 | Ben's Bites | Hosted on Substack. RSS feed confirmed live: `https://bensbites.substack.com/feed` | ✅ Free, no auth |
| 2 | The AI Rundown | Hosted on Beehiiv. RSS feed confirmed live: `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` | ✅ Free, no auth |
| 3 | Reddit | Public JSON API: `reddit.com/r/[sub]/new.json?limit=25` works without auth | ✅ No key needed initially |
| 4 | CORS | Browser can't directly fetch RSS feeds cross-origin — need a CORS proxy | ⚠️ Use `allorigins.win` or `corsproxy.io` |
| 5 | RSS Format | Both feeds return standard RSS 2.0 XML with `<item>` nodes containing `<title>`, `<link>`, `<pubDate>`, `<description>` | ✅ Parseable with DOMParser |
| 6 | Substack Feed | Ben's Bites RSS returns full article HTML inside `<content:encoded>` — can strip for summary | ✅ Rich content |
| 7 | Beehiiv Feed | The Rundown RSS returns clean `<description>` with text summary | ✅ Clean |
| 8 | Reddit JSON | Reddit `/new.json` returns `data.children[].data` with `title`, `url`, `permalink`, `created_utc`, `selftext` | ✅ No XML parsing needed |

---

## 🔗 Confirmed Feed URLs

| Source | URL | Type | Status |
|--------|-----|------|--------|
| Ben's Bites | `https://bensbites.substack.com/feed` | RSS 2.0 | ✅ Live |
| The AI Rundown | `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` | RSS 2.0 | ✅ Live |
| r/artificial | `https://www.reddit.com/r/artificial/new.json` | JSON | ✅ Live |
| r/MachineLearning | `https://www.reddit.com/r/MachineLearning/new.json` | JSON | ✅ Live |

---

## ⚠️ Constraints

| ID | Constraint | Impact | Mitigation |
|----|-----------|--------|------------|
| C-001 | CORS blocks direct RSS fetch from browser | Cannot fetch `bensbites.substack.com/feed` directly | Use `allorigins.win` CORS proxy |
| C-002 | Reddit requires `User-Agent` header for some endpoints | May 429 if called too frequently | Space calls, cache aggressively |
| C-003 | Substack may rate-limit RSS hits | Don't call more than once per 24h | 24h cache in localStorage |
| C-004 | Beehiiv RSS doesn't include article full text | Only summary/description available | Acceptable for dashboard view |

---

## 💡 Key Discoveries

- **CORS workaround:** `https://api.allorigins.win/get?url=ENCODED_URL` returns `{contents: "..."}` — works for RSS.
- **DOMParser trick:** `new DOMParser().parseFromString(xmlText, "text/xml")` works natively in browsers — no library needed.
- **Reddit public API:** Returns JSON at `/new.json` — no auth, but add `?limit=25` to cap results.
- **pubDate parsing:** Substack uses RFC 2822 (`Mon, 13 Apr 2026 10:00:00 +0000`) — `new Date(pubDate)` parses it natively.
- **Deduplication:** Hash article URLs with a simple djb2 hash — no crypto library needed.

---

## 🐛 Known Gotchas

```
[allorigins.win CORS Proxy]
- Rate limit: ~1 req/sec
- Timeout: ~5 seconds
- Returns: JSON with .contents key
- Watch for: Sometimes returns HTML error pages instead of XML — validate before parsing

[Reddit JSON API]
- Rate limit: 60 req/min unauthenticated
- Required headers: User-Agent (use a descriptive string)
- created_utc is Unix timestamp (seconds) — multiply by 1000 for JS Date

[Substack RSS]
- Description tag contains HTML — must strip tags for clean summary
- content:encoded has full HTML article — too heavy for list view, use <description> instead

[Beehiiv RSS]
- Clean description text — easiest to parse
- Image tags sometimes present in description — strip them
```
