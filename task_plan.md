# Scarper — B.L.A.S.T. Master Task Plan

This document serves as the master execution checklist and project roadmap, tracking all possible methods, discovery questions, and architectural phases for the project.

---

## 🟢 Protocol 0: Initialization (Mandatory)
- [x] Initialize Project Memory (`task_plan.md`, `findings.md`, `progress.md`)
- [x] Initialize `gemini.md` (Project Constitution - Schema, Rules, Invariants)
- [x] Halt Execution until Handshake and Discovery are complete

---

## 🏗️ Phase 1: B - Blueprint (Vision & Logic)
### Discovery Questions Answered:
- [x] **North Star:** What is the singular desired outcome? (Build an AI newsletter dashboard aggregating news every 24hrs)
- [x] **Integrations:** Which external services do we need? Are keys ready? (Ben's Bites, AI Rundown, Firebase setup)
- [x] **Source of Truth:** Where does the primary data live? (Phase 1: localStorage, Phase 2: Firebase Firestore)
- [x] **Delivery Payload:** How and where should the final result be delivered? (Vanilla HTML/CSS/JS single-page web app)
- [x] **Behavioral Rules:** How should the system act? (Described in `gemini.md` Constitution)

### Execution:
- [x] Define JSON Data Schema (Input/Output shapes) in `gemini.md`
- [x] Confirm Payload shape before coding begins
- [x] Research: Search GitHub repos and databases for helpful resources

---

## 🔗 Phase 2: L - Link (Connectivity)
### Methods & Execution:
- [x] Verification: Test all API connections (RSS Feeds, Firebase DB)
- [x] Handshake: Build minimal scripts/proxy to verify external services respond correctly (e.g., CORS proxy bypassing)
- [x] Save credentials (Supabase/APIs) to `.env` (Exception logged for Firebase public config)

---

## 📐 Phase 3: A - Architect (The 3-Layer Build)
### Layer 1: Architecture (`architecture/`)
- [x] Technical SOPs written in Markdown (`sop_fetch.md`, `sop_parse.md`, `sop_storage.md`)
- [x] Define goals, inputs, tool logic, and edge cases in SOPs before coding

### Layer 2: Navigation (Decision Making)
- [x] Route data between SOPs and Tools seamlessly (`js/app.js` Orchestrator)
- [x] Call execution tools in the correct deterministic sequence

### Layer 3: Tools (`tools/` or `js/`)
- [x] Build atomic, testable scripts (`fetcher.js`, `parser.js`, `storage.js`)
- [x] Ensure use of `.tmp/` for intermediate file operations where applicable

---

## 🎨 Phase 4: S - Stylize (Refinement & UI)
### Methods & Execution:
- [x] Payload Refinement: Format all dashboard outputs for professional delivery
- [x] UI/UX: Apply clean, brand-aligned CSS/HTML (Glassmorphism, Lime Green accents, Deep Navy background)
- [x] Interactivity: Ensure navigation, hovers, card metrics, and filters are responsive
- [x] Feedback: Present stylized results to the user for feedback before deployment

---

## 🚀 Phase 5: T - Trigger (Deployment)
### Methods & Execution:
- [ ] Cloud Transfer: Move finalized logic from local testing to the production cloud environment (e.g. Vercel / Netlify / Supabase)
- [ ] Automation: Set up execution triggers (Cron jobs / Webhooks / Firebase Functions)
- [ ] Documentation: Finalize the Maintenance Log in `gemini.md` for long-term stability

---

## 🔁 Operating Principles Tracking
- [x] **Data-First Rule:** Ensure schema is updated before modifying code.
- [ ] **Self-Annealing:** Document ALL errors in `findings.md` and patch/test fixes into `architecture/*.md`.
- [ ] **Deliverables vs Intermediates:** Guarantee cloud destination is complete.
