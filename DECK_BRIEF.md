# DECK_BRIEF — aigap Executive Deck

Ready-to-hand-off content for the 5-slide aigap stakeholder deck.
Pass this file to the `pptx` skill to generate the final presentation.

---

## Slide 1 — Title

**Headline (large):** AIGAP

**Subtitle:** AI Guardrails and Policies

**Tagline:** "Define once. Enforce everywhere. Audit always."

**Footer line:** Anirudh Yadav · v0.1.0 · 2026 · github.com/anirudhyadav/aigap

---

## Slide 2 — The Problem

**Slide title:** AI Ships Without Guardrails

**Pain point callout 1:**
> Policies live in Confluence — never enforced in code.

**Pain point callout 2:**
> By the time an LLM call violates a data-privacy rule, it is already in the audit log.

**Pain point callout 3:**
> No standard way to version, trace, or enforce AI guardrails the way we trace code changes.

**Callout bar (full width, bottom):**
"Compliance teams cannot confidently answer: *Is our AI behaving within policy?*"

---

## Slide 3 — What It Does

**Slide title:** Four Stages. One Source of Truth.

**Stage flow (left to right):**

| Stage | Label | Description |
|---|---|---|
| 1 | INGEST | Policy doc (PDF / Word / Confluence) goes in |
| 2 | EXTRACT | GP/GC/EV entities extracted, stable IDs assigned |
| 3 | ENFORCE | Runtime hooks, middleware, output filters generated |
| 4 | AUDIT | Every check logged, mapped to GP-NNN, drift tracked |

**Callout bar:**
"Stable IDs — GP-001 · GC-002 · EV-003 — never reused, never deleted"

---

## Slide 4 — Two Delivery Paths

**Slide title:** Start Simple. Scale When Ready.

**Option A — MD Prompts (left column):**
- 12 prompt templates — works with any LLM (Claude, GPT-4, Gemini)
- Zero setup — copy, paste, commit
- Full coverage: define, gap-check, audit, framework-map, PR description
- Output always goes to `.aigap/` — portable and git-tracked
- Ideal for new teams, audits, one-off compliance checks

**Option B — VS Code Extension (right column):**
- 15 Command Palette commands + `@aigap` Copilot chat participant
- Inline gap highlighting as you type
- `aigap.staleness` — git log scan for policy drift
- `aigap.ingestConfluence` — REST API pull, no copy-paste
- CI/CD gate: fails PR if any GP-XXX has no enforcement stub

**Footer callout:**
"Both paths write to the same `.aigap/` format — start simple, scale when ready."

---

## Slide 5 — Business Case

**Slide title:** Why Now

**Metric 1:**
- Number: **12**
- Label: Policy Templates
- Description: Covering every governance role — from Lead Engineer to Compliance Officer to Leadership

**Metric 2:**
- Number: **100%**
- Label: Stable Traceability
- Description: Every GP-NNN ID appears in commits, hooks, tests, audit logs, and PRs — forever

**Metric 3:**
- Number: **2×**
- Label: Delivery Paths
- Description: Copy-paste MD today. VS Code + Copilot + CI/CD gate at scale. Same `.aigap/` output.

**CTA footer:**
github.com/anirudhyadav/aigap · MIT License · No API keys required for Option A
