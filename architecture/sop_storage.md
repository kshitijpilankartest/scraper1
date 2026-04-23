# SOP-003: localStorage Read/Write
> Layer 1 — Architecture | Version 1.0 | 2026-04-13

## Goal
Persist articles, saved-article IDs, and last-fetch timestamp across browser sessions using localStorage.

## Keys
| Key | Type | Description |
|-----|------|-------------|
| `scarper_articles` | JSON string | Array of all Article objects |
| `scarper_saved_ids` | JSON string | Array of saved article ID strings |
| `scarper_last_fetched` | string | ISO8601 timestamp of last successful fetch |

## Write Rules
1. When saving articles after a fetch:
   - Load existing `scarper_articles`
   - Merge new articles (add new, keep existing by ID)
   - NEVER overwrite `is_saved` on existing articles
   - Write merged array back
2. When user saves an article:
   - Add ID to `scarper_saved_ids`
   - Update `is_saved: true` on the article in `scarper_articles`
3. When user unsaves an article:
   - Remove ID from `scarper_saved_ids`
   - Update `is_saved: false` on the article

## Read Rules
- On app load: read all three keys
- If `scarper_articles` is null → return empty array
- If `scarper_last_fetched` is null → return null (triggers fresh fetch)

## Error Handling
- Wrap all localStorage ops in try/catch (storage may be full or blocked)
- On quota exceeded: log error, do NOT crash — serve from memory
