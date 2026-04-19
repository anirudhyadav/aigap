# aigap Dashboard — index.html Design

All diagrams below define the structure, data flow, and interactions for
`aigap/server/static/index.html` — the web report dashboard served by `aigap serve`.

---

## 1. Page Layout (wireframe)

```mermaid
graph TD
    PAGE["index.html"]

    PAGE --> TOPBAR["── TopBar ──────────────────────────────────────\n  [aigap logo]  Policy: My App Policy  Run: #a1b2c3  2026-04-19 14:32\n  [Run Check ▶]  [Export JSON]  [Export MD]\n────────────────────────────────────────────────"]

    PAGE --> HERO["── Efficacy Hero ───────────────────────────────\n  Grade: B+        Score: 81/100\n  ▓▓▓▓▓▓▓▓░░  Coverage: 85%   FPR: 3%   FNR: 8%\n  Guardrail strength: MODERATE\n────────────────────────────────────────────────"]

    PAGE --> STATSROW["── Stats Row (3 cards) ─────────────────────────\n  [✅ 11 Rules Passing]  [❌ 3 Rules Failing]  [⚠️ Drift: −4.2%]\n────────────────────────────────────────────────"]

    PAGE --> MAIN["── Main Panel (2-col) ──────────────────────────"]

    MAIN --> RULETABLE["Left: Rules Table\n  Filter: [All ▾] [Category ▾] [Severity ▾]\n  ┌─────────────────────────────────────────┐\n  │ Rule            Cat      Sev   Rate  Δ  │\n  │ no-pii-leakage  guard    CRIT  100% ──  │\n  │ cite-sources    policy   MED   72%  ↓   │\n  │ ...                                     │\n  └─────────────────────────────────────────┘\n  Click row → opens Detail Panel"]

    MAIN --> DETAIL["Right: Detail Panel\n  ┌─────────────────────────────────────────┐\n  │ Rule: cite-sources                      │\n  │ Pass: 18  Fail: 7  FP: 1  FN: 2        │\n  │                                         │\n  │ Failure #1 ─────────────────────────    │\n  │   Prompt: 'What causes inflation?'      │\n  │   Response: '...' (no citation)         │\n  │   Evidence: 'Prices rose in Q3'         │\n  │   Fix: Add [source] after factual claim │\n  │                                         │\n  │ Failure #2 ─────────────────────────    │\n  │ ...                                     │\n  └─────────────────────────────────────────┘"]

    PAGE --> RECS["── Recommendations (Opus output) ───────────────\n  1. HIGH  Strengthen cite-sources guardrail — 28% failure rate\n  2. MED   Add test coverage for jailbreak edge cases (0 pairs)\n  3. LOW   Consider language-detection plugin for english-only rule\n────────────────────────────────────────────────"]

    PAGE --> DRIFT["── Drift Chart ─────────────────────────────────\n  [sparklines per rule, last 5 runs]\n  no-pii-leakage   ──────────── 100%\n  cite-sources     ████▇▆▅▄ ↓  72%\n  english-only     ──────────── 95%\n────────────────────────────────────────────────"]
```

---

## 2. Component Hierarchy

```mermaid
graph TD
    App --> TopBar
    App --> EfficacyHero
    App --> StatsRow
    App --> MainPanel
    App --> RecommendationsPanel
    App --> DriftPanel
    App --> Toast

    StatsRow --> StatCard_Pass["StatCard (passing)"]
    StatsRow --> StatCard_Fail["StatCard (failing)"]
    StatsRow --> StatCard_Drift["StatCard (drift)"]

    EfficacyHero --> GradeCircle
    EfficacyHero --> ScoreBar
    EfficacyHero --> MetricPills["MetricPills (Coverage · FPR · FNR · Strength)"]

    MainPanel --> RulesTable
    MainPanel --> DetailPanel

    RulesTable --> FilterBar
    RulesTable --> RuleRow["RuleRow × N"]

    DetailPanel --> RuleHeader
    DetailPanel --> PassFailSummary
    DetailPanel --> FailureCard["FailureCard × N"]

    FailureCard --> EvidenceBlock
    FailureCard --> FixSuggestion
    FailureCard --> PairMeta["PairMeta (pair id · tags)"]

    RecommendationsPanel --> RecItem["RecItem × N (priority · text)"]

    DriftPanel --> DriftChart
    DriftChart --> Sparkline["Sparkline × rule"]
```

---

## 3. Data Flow (server → UI)

```mermaid
sequenceDiagram
    participant User
    participant Browser as index.html (JS)
    participant API as aigap FastAPI server
    participant Chain as LLM Chain

    User->>Browser: open http://localhost:7823
    Browser->>API: GET /report/latest
    API-->>Browser: EvalResult JSON (cached last run)
    Browser->>Browser: render() — populate all components

    User->>Browser: click [Run Check ▶]
    Browser->>API: POST /check (SSE)
    API->>Chain: orchestrator.run_pipeline()

    loop per rule × pair
        Chain-->>API: ClassifierResult (SSE event: "classify")
        API-->>Browser: SSE: {type:"classify", rule_id, pair_id, verdict}
        Browser->>Browser: RuleRow.updateLive(verdict)
    end

    loop FAIL verdicts only
        Chain-->>API: AnalysisResult (SSE event: "analyze")
        API-->>Browser: SSE: {type:"analyze", rule_id, pair_id, analysis}
        Browser->>Browser: FailureCard.append(analysis)
    end

    Chain-->>API: EfficacyScore (SSE event: "synthesize")
    API-->>Browser: SSE: {type:"synthesize", efficacy}
    Browser->>Browser: EfficacyHero.update(efficacy)
    Browser->>Browser: RecommendationsPanel.update(recs)

    API-->>Browser: SSE: {type:"done", run_id}
    Browser->>Browser: Toast("Run complete — grade B+")

    User->>Browser: click [Export JSON]
    Browser->>API: GET /report/{run_id}/json
    API-->>Browser: file download
```

---

## 4. State Machine (UI states)

```mermaid
stateDiagram-v2
    [*] --> Idle : page load, GET /report/latest

    Idle --> Running : user clicks Run Check
    Idle --> Idle : user filters/selects rows (local)

    Running --> Classifying : SSE stream opened
    Classifying --> Classifying : SSE classify events (per pair)
    Classifying --> Analyzing : all classify events received
    Analyzing --> Analyzing : SSE analyze events (FAIL pairs)
    Analyzing --> Synthesizing : SSE synthesize event
    Synthesizing --> Done : SSE done event

    Done --> Idle : user dismisses toast
    Running --> Error : SSE error / server down
    Error --> Idle : user retries
```

---

## 5. SSE Event Schema

```mermaid
classDiagram
    class SSEEvent {
        +str type
        +str run_id
    }

    class ClassifyEvent {
        +str rule_id
        +str pair_id
        +str verdict  // pass | fail | skip | error
        +float confidence
        +str rationale
        +bool from_cache
    }

    class AnalyzeEvent {
        +str rule_id
        +str pair_id
        +str failure_reason
        +str root_cause
        +str suggested_fix
        +str evidence
        +str fix_priority  // immediate | soon | backlog
    }

    class SynthesizeEvent {
        +float overall_score
        +str grade  // A | B | C | D | F
        +float coverage_score
        +float false_positive_rate
        +float false_negative_rate
        +str guardrail_strength
        +list~str~ top_risks
        +list~str~ recommendations
    }

    class DoneEvent {
        +str run_id
        +int duration_ms
        +int total_api_calls
        +int cache_hits
    }

    SSEEvent <|-- ClassifyEvent
    SSEEvent <|-- AnalyzeEvent
    SSEEvent <|-- SynthesizeEvent
    SSEEvent <|-- DoneEvent
```

---

## 6. URL & API surface used by index.html

```mermaid
graph LR
    UI["index.html"]

    UI -->|GET| R1["/  → serves index.html"]
    UI -->|GET| R2["/report/latest  → EvalResult JSON"]
    UI -->|GET| R3["/report/{run_id}/json  → download"]
    UI -->|GET| R4["/report/{run_id}/markdown  → download"]
    UI -->|POST SSE| R5["/check  → streams SSE events"]
    UI -->|GET| R6["/baseline  → DriftReport JSON"]
    UI -->|GET| R7["/health  → {status, version}"]
    UI -->|GET| R8["/rules  → list of PolicyRule"]

    style R5 fill:#f5a623,color:#000
```

---

## 7. Tech stack (no framework, vanilla)

```mermaid
graph TD
    HTML["index.html\n(single file, no bundler)"]

    HTML --> CSS["style block\n— CSS custom properties for theming\n— CSS Grid: TopBar / Hero / Stats / Main(2-col) / Recs / Drift\n— No external CSS framework"]

    HTML --> JS["script block (ES modules)\n— fetch() + EventSource for SSE\n— Custom elements (HTMLElement subclasses)\n  · <aigap-grade-circle>\n  · <aigap-rule-row>\n  · <aigap-failure-card>\n  · <aigap-sparkline>\n— No React / Vue / Alpine\n— State: plain JS object, mutated on SSE events\n— render(): DOM diffing by data-id attributes"]

    HTML --> FONTS["Google Fonts: Inter\n(single CDN import)"]
    HTML --> MERMAID_SKIP["No charting lib\n— Sparklines: inline SVG drawn by JS\n— Score bar: CSS width %\n— Grade circle: SVG stroke-dashoffset"]
```

---

## Implementation decisions (resolved)

> `aigap/server/static/index.html` is fully implemented. Decisions below record what was chosen.

| # | Question | Decision |
|---|---|---|
| 1 | Single-file vs separate assets? | **Single file** — inlined CSS + JS, served directly by FastAPI `StaticFiles`. No bundler needed. |
| 2 | Dark mode? | **Dark by default** — GitHub-style dark palette (`#0d1117` bg) via CSS custom properties. Light mode not added yet. |
| 3 | Drift chart granularity? | **Last 5 runs** — `/history` endpoint is live and returns per-rule pass-rates from the latest report. |
| 4 | Live tail vs full refresh? | **Live cell-by-cell** — SSE `classify` events update pass-rate bars in real time; `synthesize` event refreshes the hero grade ring. |
| 5 | Auth for VS Code extension? | **None for now** — server is localhost-only. Token auth deferred to v2 alongside the extension. |

## Implemented

- `aigap/server/static/index.html` — vanilla JS, no framework, ~700 lines
- `aigap/server/app.py` — all endpoints wired: `/`, `/health`, `/report/latest`, `/report/{id}/json`, `/report/{id}/markdown`, `/baseline`, `/history`, `/rules`, `/check` (SSE)
- `aigap/server/sse.py` — `SSEQueue` bridges orchestrator `on_event` callback to FastAPI `StreamingResponse`
- `/check` triggers a real pipeline run via the orchestrator and streams live events to the dashboard
- SSE fallback: if server unreachable on page load or Run Check, dashboard renders from built-in mock data automatically

---

## See also — Runbooks

Full operational documentation lives in [`docs/runbooks/`](./runbooks/README.md):

| Runbook | Covers |
|---|---|
| [Getting started](./runbooks/getting-started.md) | Install, first run, dashboard |
| [Dashboard](./runbooks/dashboard.md) | Every panel, live run, export, API |
| [LLM chain internals](./runbooks/llm-chain.md) | Haiku → Sonnet → Opus, caching, cost |
| [Policy authoring](./runbooks/policy-authoring.md) | Writing `.aigap-policy.yaml` |
| [Plugin development](./runbooks/plugin-development.md) | Custom `PolicyPlugin` subclasses |
| [CI integration](./runbooks/ci-integration.md) | GitHub Actions, drift gate |
| [Baseline & drift](./runbooks/baseline-drift.md) | Tracking pass-rate changes |
| [Dataset management](./runbooks/dataset-management.md) | Golden datasets, labelling |
| [Troubleshooting](./runbooks/troubleshooting.md) | Errors and fixes |
