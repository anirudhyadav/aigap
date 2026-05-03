# AIGAP — Complete Feature Reference

> AI Guardrails and Policies — all features across both delivery paths.

---

## What AIGAP Does

Evaluates LLM applications against declared YAML policies, running a three-stage LLM chain (Haiku → Sonnet → Opus) against golden datasets. Produces scored reports with drift tracking, ships five built-in guardrail plugins and a plugin API for custom rules, and serves a live web dashboard. Keeps the thread alive between what the governance team defined and what the AI system actually does.

---

## Input Formats

| Format | Supported |
|---|---|
| YAML policy file | ✅ |
| JSONL golden dataset | ✅ |
| YAML golden dataset | ✅ |
| JSON golden dataset | ✅ |
| Policy doc (PDF/Word/Markdown) | ✅ (via prompts or VS Code) |

---

## Core Evaluation

| Feature | What it produces |
|---|---|
| **Three-stage pipeline** | Haiku classify → Sonnet analyze → Opus synthesize |
| **Fast pattern short-circuit** | Regex `fast_patterns` skip LLM when verdict is certain |
| **Plugin fast_check()** | Plugin logic runs before LLM — immediate verdict if confident |
| **Prompt caching** | `cache_control: ephemeral` on rule system prompts — first pair warms, rest hit cache |
| **Stable policy IDs** | `GP-001`, `GC-002`, `EV-003` — never reused, never deleted |
| **Enforcement vectors** | Pre-call hooks, output filters, middleware, test assertions, manual review |
| **Ambiguity flagging** | Identifies vague policy descriptions — flags for governance team resolution |
| **Conflict detection** | Finds contradicting rules — flags for escalation |

---

## Guardrail Plugins

| Feature | What it detects | Plugin class |
|---|---|---|
| **PII leakage** | SSN, credit cards, phone, email, IP, DOB, passport | `PiiLeakagePlugin` |
| **Prompt injection** | Override / role-switch / delimiter / leakage / indirect | `PromptInjectionPlugin` |
| **Jailbreak** | DAN / persona / fictional / hypothetical / grandma / token-smuggling | `JailbreakPlugin` |
| **Harmful content** | CBRN / weapons / self-harm / hate speech / CSAM / dangerous chemistry | `HarmfulContentPlugin` |
| **Competitor mention** | Configurable competitor list + comparison-language flag | `CompetitorMentionPlugin` |

---

## Scoring & Grading

| Feature | What it does |
|---|---|
| **Efficacy score** | `0.40 × pass_rate + 0.30 × coverage + 0.30 × (1 − FNR)` |
| **Grade assignment** | A (≥90) · B (≥75) · C (≥60) · D (≥45) · F (<45) |
| **Guardrail strength** | Strong (FNR=0%) · Moderate (<5%) · Weak (<15%) · Absent (≥15%) |
| **Coverage scoring** | Per-rule coverage = (covered rules / total rules) × 100 |
| **FP/FN tracking** | False positive / negative rates computed per rule |

---

## Ongoing Maintenance

| Feature | What it does | Command (VS Code) | Prompt (Option A) |
|---|---|---|---|
| **Policy update** | Appends new rule to POLICIES.md with next stable ID | `aigap: Update Policy` | `prompts/update-policy.md` |
| **Change impact analysis** | Old policy doc vs new — flags new, changed, removed rules | `aigap: Analyse Change Impact` | `prompts/change-impact.md` |
| **Staleness detection** | Cross-references GP-XXX IDs against git log — flags rules not touched in N days | `aigap: Check Policy Staleness` | — |
| **POLICIES.md validation** | Checks structure integrity, cross-references, duplicate IDs | `aigap: Validate Policies` | `prompts/validate-policies.md` |

---

## Traceability

| Feature | What it produces | Command |
|---|---|---|
| **Policy Traceability Matrix** | Maps every GP/GC/EV to its enforcement stubs and test files | `aigap: Show Traceability Matrix` |
| **Gap report** | Which open files have zero enforcement against GP-NNN policies | `aigap: Show Gap Report` · `prompts/gap-analysis.md` |
| **Enforcement linkage** | Scans enforcement files for GP-XXX mentions — produces coverage % | `aigap: Link Policies to Enforcement` |
| **PR description drafting** | Maps code changes to policy IDs in the PR description | `aigap: Draft Pull Request Description` |

---

## Delivery Tools

| Feature | What it produces | Command (VS Code) | Prompt (Option A) |
|---|---|---|---|
| **Enforcement generation** | Enforcement stubs (hooks, filters, middleware) from POLICIES.md | `aigap: Generate Enforcement` | `prompts/generate-enforcement.md` |
| **Audit report** | Maps policy IDs to audit log entries | `aigap: Generate Audit Report` | `prompts/audit-report.md` |
| **Sprint feed** | POLICIES.md → TASK-NNN cards with story points and acceptance criteria | `aigap: Generate Sprint Feed` | `prompts/sprint-feed.md` |
| **Release notes** | git diff → release notes mapped to policy IDs | `aigap: Generate Release Notes` | `prompts/release-notes.md` |
| **PO status report** | Plain-English compliance status for leadership sign-off | `aigap: Generate Status Report` | `prompts/po-status-report.md` |
| **Framework mapping** | Tags policies against EU AI Act / NIST AI RMF / ISO 42001 / SOC 2 | `aigap: Map Compliance Frameworks` | `prompts/framework-map.md` |

---

## Ingestion

| Feature | What it does | Command |
|---|---|---|
| **Confluence ingestion** | Fetches Confluence page + children via REST API → POLICIES.md | `aigap: Ingest from Confluence` |
| **Multi-format parsing** | Handles mixed-format policy docs (PDF tables, DOCX tracked changes) | automatic |

---

## @aigap Copilot Chat Participant

```
@aigap what is GP-003?    ← look up any policy by ID
@aigap tasks              ← list open enforcement tasks
@aigap coverage           ← coverage % for current file
@aigap rtm                ← refresh traceability matrix
```

---

## Web Dashboard

`aigap serve` → `http://localhost:7823`

| Section | What it shows |
|---|---|
| Efficacy Hero | Grade ring (A–F), score bar, Coverage · FPR · FNR · Strength pills |
| Stats row | Passing rules / Failing rules / Drift delta |
| Rules table | Filterable by verdict / category / severity; pass-rate bar + drift arrow |
| Detail panel | Click any rule → FP/FN counts + failure cards with evidence, root cause, fix |
| Recommendations | 3–5 prioritised items from Opus Stage 3 |

---

## CI/CD

Runs policy check on every PR via GitHub Actions:

```yaml
jobs:
  aigap-check:
    uses: org/aigap/.github/workflows/aigap-reusable.yml@main
```

The `--ci` flag writes a Markdown scorecard to `$GITHUB_STEP_SUMMARY`, visible directly in the PR Checks UI.

---

## Delivery Path Comparison

| Feature | Option A (prompts/) | Option B (vscode-extension/) |
|---|---|---|
| Setup | Zero | 15 min |
| LLM | Any (manual paste) | GitHub Copilot (auto) |
| Policy extraction | ✅ `define-policies.md` | ✅ `aigap: Initialize from Policy Doc` |
| Update policy | ✅ `update-policy.md` | ✅ `aigap: Update Policy` |
| Validate POLICIES.md | ✅ `validate-policies.md` | ✅ `aigap: Validate Policies` |
| Gap analysis | ✅ `gap-analysis.md` | ✅ `aigap: Show Gap Report` |
| Enforcement generation | ✅ `generate-enforcement.md` | ✅ `aigap: Generate Enforcement` |
| Sprint feed | ✅ `sprint-feed.md` | ✅ `aigap: Generate Sprint Feed` |
| Change impact analysis | ✅ `change-impact.md` | ✅ `aigap: Analyse Change Impact` |
| PR description | ✅ `pr-description.md` | ✅ `aigap: Draft Pull Request Description` |
| Framework mapping | ✅ `framework-map.md` | ✅ `aigap: Map Compliance Frameworks` |
| Release notes | ✅ `release-notes.md` | ✅ `aigap: Generate Release Notes` |
| Status report | ✅ `po-status-report.md` | ✅ `aigap: Generate Status Report` |
| Audit report | ✅ `audit-report.md` | ✅ `aigap: Generate Audit Report` |
| Traceability matrix | ❌ | ✅ interactive tree view |
| Policy staleness | ❌ needs git log | ✅ `aigap: Check Policy Staleness` |
| Enforcement linkage | ❌ needs repo scan | ✅ `aigap: Link Policies to Enforcement` |
| Confluence ingestion | ❌ needs REST API | ✅ `aigap: Ingest from Confluence` |
| @aigap chat participant | ❌ | ✅ |
| CI/CD integration | ❌ | ✅ |
| Works offline / air-gapped | ✅ | ❌ |
| API keys required | None | None |

---

## ID Reference

| Format | Example | Scope |
|---|---|---|
| `GP-NNN` | `GP-001`, `GP-012` | Guardrail Policies |
| `GC-NNN` | `GC-001`, `GC-003` | Guardrail Categories |
| `EV-NNN` | `EV-001`, `EV-005` | Enforcement Vectors |
| `FR-NNN` | `FR-001` | Framework References |
| `TASK-NNN` | `TASK-001` | Sprint tasks |

**Types:** `GP` Guardrail Policy · `GC` Guardrail Category · `EV` Enforcement Vector · `FR` Framework Reference · `TASK` Sprint Task

---

## Personas

| Role | Option A (prompts/) | Option B (VS Code) |
|---|---|---|
| **Governance Lead** | `define-policies.md` · `validate-policies.md` | `aigap: Initialize from Policy Doc` |
| **Lead Engineer** | `update-policy.md` · `change-impact.md` | `aigap: Update Policy` |
| **Developer** | `gap-analysis.md` · `pr-description.md` | `@aigap tasks` · `aigap: Show Gap Report` |
| **QA / Tester** | `generate-enforcement.md` | `aigap: Generate Enforcement` |
| **Release Manager** | `release-notes.md` | `aigap: Generate Release Notes` |
| **Scrum Master** | `sprint-feed.md` | `aigap: Generate Sprint Feed` |
| **Compliance Officer** | `framework-map.md` · `audit-report.md` | `aigap: Map Compliance Frameworks` |
| **Product Owner** | `po-status-report.md` | `aigap: Generate Status Report` |

---

*AIGAP v0.1 — MIT License — Author: Anirudh Yadav*
