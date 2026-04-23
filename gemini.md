# 📜 gemini.md — Project Constitution
> **This file is LAW. Do not modify without architectural justification.**
> Last Updated: 2026-04-13

---

## 🧬 Project Identity
- **Project Name:** Scarper
- **System Pilot:** Antigravity (B.L.A.S.T. Protocol)
- **Architecture:** A.N.T. 3-Layer (Architecture / Navigation / Tools)
- **Status:** 🟢 Phase 3 — Architect (Building)

---

## 🎯 North Star
> **Automatically collect the latest AI/tech articles from newsletters (Ben's Bites, The AI Rundown) every 24 hours and display them in a beautiful, interactive dashboard with article saving/persistence — powered by an RSS scraper with localStorage, and eventually Supabase.**

---

## 🔗 Integrations

| Service | Purpose | Key Status | Method |
|---------|---------|------------|--------|
| Ben's Bites | AI newsletter source | ✅ No key needed | RSS Feed: `https://bensbites.substack.com/feed` |
| The AI Rundown | AI newsletter source | ✅ No key needed | RSS Feed (Beehiiv): `https://rss.beehiiv.com/feeds/2R3C6Bt5wj.xml` |
| Reddit | Community posts | ✅ No key for public JSON | Public JSON API: `reddit.com/r/[sub]/new.json` |
| Supabase | Cloud persistence | ⏳ Phase 5 (later) | REST API + JS SDK |

---

## 🗃️ Source of Truth
> **Phase 1:** Browser `localStorage` — all fetched articles and saved-article flags persist on refresh inside the website itself.
> **Phase 2:** Firebase Firestore — handles real-time cloud persistence for article interaction metrics (Likes/Dislikes) across devices via `js/firebaseSetup.js`.
> **Phase 5 (future):** Supabase database — full cloud sync across devices.

---

## 📦 Delivery Payload
- A **gorgeous, interactive single-page dashboard** (HTML/CSS/JS)
- Fetches fresh articles on load; **auto-refreshes every 24 hours** via `setInterval` / timestamp check
- Shows new articles if found; silently skips if none
- User can **save/bookmark articles**; saved state persists via `localStorage`
- All fetched articles cached in `localStorage` — visible on every refresh

---

## 📐 Data Schema

### Input Shape (RSS Feed Item)
```json
{
  "source": "Ben's Bites",
  "feed_url": "https://bensbites.substack.com/feed",
  "raw_item": {
    "title": "string",
    "link": "string",
    "pubDate": "RFC822 date string",
    "description": "HTML string (truncated for preview)"
  }
}
```

### Output / Article Object Shape
```json
{
  "id": "sha256_hash_of_url",
  "source": "Ben's Bites | The AI Rundown | Reddit",
  "source_color": "#hex",
  "title": "string",
  "summary": "string (first 200 chars, HTML stripped)",
  "url": "string",
  "thumbnailUrl": "string",
  "published_at": "ISO8601",
  "fetched_at": "ISO8601",
  "is_new": true,
  "is_saved": false
}
```

### localStorage Schema
```json
{
  "scarper_articles": "[Article[]]",
  "scarper_saved_ids": "[string[]]",
  "scarper_last_fetched": "ISO8601 timestamp"
}
```

---

## 🧠 Behavioral Rules

| Rule ID | Rule | Enforced In |
|---------|------|-------------|
| R-001 | Never scrape/fetch more than once per 24h unless user manually refreshes | `tools/fetch_feeds.js` |
| R-002 | Deduplicate by article URL hash before saving to localStorage | `tools/fetch_feeds.js` |
| R-003 | If a field is missing, use empty string — never skip the article | `tools/parser.js` |
| R-004 | Articles from the last 24h are flagged `is_new: true` | `tools/parser.js` |
| R-005 | Saved state never gets overwritten by a new fetch | `tools/storage.js` |
| R-006 | All secrets (future Supabase) go in `.env`. Exception: Firebase web config keys are public by design. | All tools |
| R-007 | Dashboard must be usable with no internet (serve cached articles) | `index.html` |

---

## 🏛️ Architectural Invariants
1. **Tools are atomic** — each script in `tools/` does exactly one thing.
2. **Secrets live in `.env`** — never hardcoded in scripts.
3. **Intermediates go to `.tmp/`** — never committed to source.
4. **SOPs lead code** — update `architecture/*.md` before updating any script.
5. **Failures are documented** — every error is logged in `progress.md` and the fix is recorded in the relevant SOP.

---

## 📂 Directory Structure
```
Scarper/
├── gemini.md                    # Project Constitution (this file)
├── .env                         # API Keys/Secrets (Supabase for Phase 5)
├── task_plan.md                 # Phases, goals, checklists
├── findings.md                  # Research, discoveries, constraints
├── progress.md                  # Done, errors, tests, results
├── index.html                   # Main dashboard (single-page app)
├── css/
│   └── styles.css               # Dashboard styling
├── js/
│   ├── app.js                   # Main orchestrator
│   ├── fetcher.js               # RSS fetch + CORS proxy logic
│   ├── parser.js                # RSS XML → Article object
│   ├── storage.js               # localStorage read/write
│   └── renderer.js              # DOM rendering
├── architecture/                # Layer 1: SOPs
│   ├── sop_fetch.md
│   ├── sop_parse.md
│   └── sop_storage.md
└── .tmp/                        # Ephemeral workbench
```
