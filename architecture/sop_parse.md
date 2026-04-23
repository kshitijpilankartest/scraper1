# SOP-002: Parse RSS/Reddit Items → Article Objects
> Layer 1 — Architecture | Version 1.0 | 2026-04-13

## Goal
Convert raw RSS `<item>` nodes and Reddit `data` objects into standardized Article objects.

## Article Schema
```json
{
  "id": "djb2_hash_of_url",
  "source": "string",
  "source_color": "#hex",
  "title": "string",
  "summary": "string (max 200 chars, HTML stripped)",
  "url": "string",
  "published_at": "ISO8601",
  "fetched_at": "ISO8601",
  "is_new": true,
  "is_saved": false
}
```

## RSS Parsing Rules
- `id` = djb2 hash of `<link>` text
- `title` = `<title>` text content
- `summary` = strip HTML from `<description>`, truncate at 200 chars
- `url` = `<link>` text content
- `published_at` = `new Date(<pubDate> text).toISOString()`
- `is_new` = `published_at` is within last 24h of NOW

## Reddit Parsing Rules
- `id` = djb2 hash of `data.url`
- `title` = `data.title`
- `summary` = `data.selftext` (first 200 chars) or `"[Link Post]"` if empty
- `url` = `data.url`
- `published_at` = `new Date(data.created_utc * 1000).toISOString()`
- `is_new` = same 24h rule

## Edge Cases
- Missing title → use `"Untitled"`
- Missing URL → skip article entirely
- Missing pubDate → use `fetched_at` as fallback
- HTML in summary → strip all tags with regex: `//<[^>]+>/g`
