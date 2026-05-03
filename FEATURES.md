# FEATURES — aigap

Complete feature reference for AI Guardrails and Policies v0.1.0.

---

## Input formats

| Format | Supported | Notes |
|---|---|---|
| Markdown (`.md`) | ✅ | Policy docs, Confluence exports |
| PDF | ✅ | Extracted via CLI loader |
| Word (`.docx`) | ✅ | Extracted via CLI loader |
| YAML (`.yaml`) | ✅ | `.aigap-policy.yaml` — runtime format |
| JSON | ✅ | Dataset golden pairs |
| JSONL | ✅ | Recommended for CI |
| Confluence REST API | ✅ (Option B) | `aigap.ingestConfluence` command |
| Plain text | ✅ | Any prose policy document |

---

## Core capabilities

### Policy extraction and structuring

| Capability | Description |
|---|---|
| Category detection | Groups policies into `GC-NNN` categories (e.g. Data Privacy, Safety) |
| Policy rule extraction | Creates `GP-NNN` guardrail entries with ID, name, description, severity |
| Enforcement vector mapping | Tags each policy with `EV-NNN` (pre-call hook, output filter, middleware) |
| Severity assignment | `critical / high / medium / low` per policy rule |
| Stable ID assignment | Sequential IDs never reused, never deleted |
| Registry tracking | `registry.json` holds the ID counter per type |

### Runtime enforcement (CLI)

| Capability | Description |
|---|---|
| Stage 1: Classify (Haiku) | Every rule × pair — fast, prompt-cached |
| Stage 2: Analyze (Sonnet) | FAIL pairs only — evidence, root cause, fix |
| Stage 3: Synthesize (Opus) | One call per run — grade A–F, score, recommendations |
| Fast-pattern pre-filter | Regex short-circuits LLM for certain verdicts |
| Disk cache | SHA1-keyed cache persists results between CI runs |
| Async fan-out | Configurable concurrency (default 10 parallel calls) |

### Builtin guardrail plugins

| Plugin | What it catches |
|---|---|
| `PiiLeakagePlugin` | SSN, credit cards, phone, email, IP, date of birth |
| `PromptInjectionPlugin` | Override/role-switch/delimiter/leakage/indirect injection |
| `JailbreakPlugin` | DAN/persona/fictional/hypothetical/grandma/token-smuggling |
| `HarmfulContentPlugin` | CBRN, weapons, self-harm, hate speech, CSAM, dangerous chemistry |
| `CompetitorMentionPlugin` | Configurable competitor list + comparison-language flag |

### Ongoing maintenance

| Capability | Description |
|---|---|
| Update single policy | Append new `GP-NNN` with next sequential ID |
| Validate integrity | Duplicate ID detection, missing fields, category orphans |
| Gap analysis | Scan code files for unenforced `GP-NNN` references |
| Policy drift detection | `git log` scan — code that used to comply but no longer does |
| Change impact | Old vs new policy doc — what changed, what breaks |
| Staleness check | Policies with no enforcement vector after N commits |

### Traceability

| Capability | Description |
|---|---|
| Policy traceability matrix | `index.md` — every `GP-NNN` mapped to code, tests, and PRs |
| Audit log mapping | `audit-report.md` — policy ID → logged enforcement events |
| Test linkage | Scan test files for `GP-NNN` mentions |
| PR description generation | `git diff` + `POLICIES.md` → traceable PR body |
| Release notes | Commit history mapped to policy IDs |
| Regulation framework map | `GP-NNN` → EU AI Act / NIST AI RMF / ISO 42001 / GDPR Art.22 |

### Delivery tools

| Capability | Description |
|---|---|
| Sprint feed | Policies → `TASK-NNN` cards with story points |
| Status report | Plain-English compliance % for leadership |
| Web dashboard | FastAPI server at `:7823` — grade ring, rules table, drift sparklines |
| GitHub Actions | CI mode — step summary + PR coverage comment |

---

## Delivery path comparison

Every feature listed once. Both paths write to the same `.aigap/` format.

| Feature | Option A — MD Prompts | Option B — VS Code Extension |
|---|---|---|
| **INITIALIZATION** | | |
| Convert policy doc → POLICIES.md | ✅ `define-policies.md` | ✅ `aigap.init` |
| Ingest from Confluence | ❌ (manual copy-paste) | ✅ `aigap.ingestConfluence` |
| **POLICY MANAGEMENT** | | |
| Add new guardrail (next stable ID) | ✅ `update-policy.md` | ✅ `aigap.update` |
| Validate ID integrity + structure | ✅ `validate-policies.md` | ✅ `aigap.validate` |
| **ANALYSIS** | | |
| Gap analysis (unenforced policies) | ✅ `gap-analysis.md` | ✅ `aigap.gapReport` |
| Change impact (old vs new doc) | ✅ `change-impact.md` | ✅ `aigap.changeImpact` |
| Policy staleness (git log scan) | ❌ (no git access) | ✅ `aigap.staleness` |
| **ENFORCEMENT** | | |
| Generate enforcement stubs | ✅ `generate-enforcement.md` | ✅ `aigap.enforcement` |
| Runtime CLI evaluation | ✅ `aigap check` (CLI) | ✅ `aigap check` (terminal) |
| **AUDIT & COMPLIANCE** | | |
| Audit log mapping | ✅ `audit-report.md` | ✅ `aigap.auditReport` |
| Framework map (EU AI Act / NIST / ISO) | ✅ `framework-map.md` | ✅ `aigap.frameworkMap` |
| Link policies to test files | ❌ (no workspace access) | ✅ `aigap.testLinkage` |
| **DELIVERY** | | |
| Draft PR description | ✅ `pr-description.md` | ✅ `aigap.prDraft` |
| Generate release notes | ✅ `release-notes.md` | ✅ `aigap.releaseNotes` |
| Generate sprint feed (TASK-NNN cards) | ✅ `sprint-feed.md` | ✅ `aigap.sprintFeed` |
| Leadership status report | ✅ `po-status-report.md` | ✅ `aigap.statusReport` |
| **CHAT** | | |
| Natural language policy queries | ❌ (LLM chat only) | ✅ `@aigap` participant |
| **CI/CD** | | |
| GitHub Actions gap check | ✅ `aigap check --ci` (CLI) | ✅ `aigap check --ci` (CLI) |
| PR coverage comment | ✅ via CLI `--ci` flag | ✅ via CLI `--ci` flag |
| Fail on unenforced GP-XXX | ✅ `--fail-on high` | ✅ `--fail-on high` |

---

## Personas

| Role | Option A (MD Prompts) | Option B (VS Code) |
|---|---|---|
| **Lead Engineer** | `define-policies.md`, `change-impact.md` | `aigap.init`, `aigap.changeImpact`, `aigap.staleness` |
| **Developer** | `gap-analysis.md`, `pr-description.md` | `@aigap tasks`, `aigap.gapReport`, `aigap.prDraft` |
| **QA / Tester** | `audit-report.md` | `aigap.auditReport`, `aigap.testLinkage` |
| **Compliance Officer** | `framework-map.md` | `aigap.frameworkMap`, `aigap.auditReport` |
| **Scrum Master** | `sprint-feed.md` | `aigap.sprintFeed` |
| **Release Manager** | `release-notes.md` | `aigap.releaseNotes` |
| **Leadership / PO** | `po-status-report.md` | `aigap.statusReport` |

---

## Living artefacts (`.aigap/` folder)

| File | Written by | Contents |
|---|---|---|
| `registry.json` | All init/update commands | ID counter per type — never reused |
| `POLICIES.md` | `define-policies.md` / `aigap.init` | Categories (GC), policies (GP), vectors (EV) |
| `index.md` | `aigap.validate` | Traceability matrix: GP → code → tests → PRs |
| `gap-report.md` | `gap-analysis.md` / `aigap.gapReport` | Unenforced policies per file |
| `enforcement/` | `generate-enforcement.md` / `aigap.enforcement` | Stubs: hooks, middleware, filters |
| `audit-report.md` | `audit-report.md` / `aigap.auditReport` | Policy ID → audit event mapping |
| `change-impact-report.md` | `change-impact.md` / `aigap.changeImpact` | Delta between policy versions |
| `framework-map.md` | `framework-map.md` / `aigap.frameworkMap` | EU AI Act / NIST / ISO 42001 coverage |
| `sprint-feed.md` | `sprint-feed.md` / `aigap.sprintFeed` | TASK-NNN enforcement cards |
| `releases/vN.md` | `release-notes.md` / `aigap.releaseNotes` | Policy-mapped release notes |
| `releases/status-vN.md` | `po-status-report.md` / `aigap.statusReport` | Leadership compliance status |
