# AIGAP — AI Guardrails and Policies

> Evaluate LLM applications against a declared policy. Define once. Enforce everywhere. Audit always.

---

## The Problem AIGAP Solves

Most teams ship AI without enforceable guardrails. Policies live in Confluence — never enforced in code. By the time an LLM call violates a data-privacy rule, it is already in the audit log. No one can confidently answer: *"Is our AI behaving within policy?"*

**AIGAP keeps that thread alive — in the repo itself, versioned alongside the code.**

---

## Two Delivery Paths

| | Option A — MD Prompts | Option B — VS Code Extension |
|---|---|---|
| **Setup** | Zero. Copy-paste markdown. | Install extension + GitHub Copilot |
| **LLM** | Any — paste into Claude, ChatGPT, Gemini, Copilot | GitHub Copilot via `vscode.lm` — no API key needed |
| **Best for** | Individuals, one-off audits, any LLM preference | Org teams on GitHub Enterprise + Copilot |
| **Output** | Paste result into `.aigap/POLICIES.md` | Auto-writes `.aigap/` in repo |
| **Docs** | [`prompts/README.md`](prompts/README.md) | [`PLAYBOOK.md`](PLAYBOOK.md) |

---

## Repository Structure

```
aigap/
├── README.md                              ← you are here
├── FEATURES.md                            ← complete feature reference
├── PLAYBOOK.md                            ← VS Code extension full guide
├── DECK_BRIEF.md                          ← executive deck content
│
├── prompts/                               ← Option A: copy-paste templates (zero setup)
│   ├── README.md
│   ├── define-policies.md                 ← policy doc → GP/GC/EV entities
│   ├── update-policy.md                   ← append new rule with next stable ID
│   ├── validate-policies.md               ← check for duplicate IDs, missing fields
│   ├── gap-analysis.md                    ← code file vs POLICIES.md coverage check
│   ├── generate-enforcement.md            ← generate enforcement stubs
│   ├── audit-report.md                    ← map policy IDs to audit entries
│   ├── change-impact.md                   ← old vs new policy delta analysis
│   ├── framework-map.md                   ← policies vs EU AI Act/NIST/ISO 42001
│   ├── pr-description.md                  ← traceable PR from git diff + POLICIES.md
│   ├── release-notes.md                   ← policy-mapped release notes
│   ├── po-status-report.md                ← compliance status for leadership
│   └── sprint-feed.md                     ← policies → sprint tasks with story points
│
├── vscode-extension/                      ← Option B: VS Code Extension (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── extension.ts                   ← registers all 15 commands + @aigap participant
│       ├── chat/                          ← @aigap Copilot Chat participant
│       ├── commands/                      ← 15 VS Code commands
│       ├── core/
│       │   ├── parsers/                   ← PDF, DOCX, Markdown
│       │   ├── extractors/                ← categories, policies, enforcement vectors
│       │   ├── generators/                ← POLICIES.md, enforcement, audit, sprint, framework
│       │   └── analyzers/                 ← gap, change impact, staleness, enforcement linkage
│       ├── llm/                           ← vscode.lm wrapper — no API key required
│       ├── views/                         ← traceability tree view, gap report panel
│       └── workspace/                     ← workspace reader/writer/detector
│
├── aigap/                                 ← Python package (CLI + library)
│   ├── cli.py                             ← Typer CLI entry point
│   ├── config.py                          ← model names, defaults
│   ├── models/                            ← Pydantic data models
│   ├── loaders/                           ← YAML/JSONL/JSON loaders
│   ├── pipeline/                          ← three-stage LLM chain
│   ├── plugins/                           ← guardrail plugin system
│   ├── scoring/                           ← efficacy, coverage, drift
│   ├── report/                            ← Markdown, JSON, GHA summary
│   └── server/                            ← FastAPI dashboard + SSE
│
├── tests/                                 ← unit + integration tests
├── examples/                              ← example policies + datasets
├── .github/workflows/
│   ├── aigap-ci.yaml                      ← CI: lint + test + guardrail check
│   ├── aigap-release.yaml                 ← PyPI publish on release
│   └── aigap-reusable.yml                 ← reusable policy check for consumer repos
└── pyproject.toml
```

---

## Quick Start

### Option A — Zero Setup (5 minutes)

1. Open [`prompts/define-policies.md`](prompts/define-policies.md)
2. Replace `[PASTE YOUR POLICY DOCUMENT TEXT HERE]` with your policy content
3. Paste into any LLM (Claude, ChatGPT, Copilot Chat, Gemini)
4. Copy the output into `.aigap/POLICIES.md` in your repo
5. Commit it — your team now has a living guardrail spec

### Option B — VS Code Extension

```bash
cd vscode-extension
npm install
# Press F5 in VS Code to launch Extension Development Host
# Command Palette → aigap: Initialize from Policy Doc → select your PDF or Word file
```

**Org-wide deployment:**
```bash
cd vscode-extension
npm install && npm run package
# Distribute aigap-0.1.0.vsix via MDM or VS Code Server
code --install-extension aigap-0.1.0.vsix
```

### Python CLI (runtime checks)

```bash
pip install aigap          # requires Python ≥ 3.11
export ANTHROPIC_API_KEY=sk-ant-...

# 1. Scaffold a policy file and example dataset
aigap init --template customer-support

# 2. Run a check
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl

# 3. Save a baseline for drift tracking
aigap baseline save

# 4. Open the web dashboard
aigap serve           # → http://localhost:7823

# 5. CI mode (writes GitHub Actions step summary)
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json \
  --ci --fail-on high --output aigap-report.json
```

---

## The `.aigap/` Folder

Both delivery paths write to the same format — **commit `.aigap/` to git.**

```
.aigap/
├── registry.json              # ID counter — never reused
├── POLICIES.md                # Living guardrail spec: categories, policies, vectors
├── index.md                   # Policy traceability matrix
├── gap-report.md              # Unenforced policies flagged
├── enforcement/               # Generated enforcement stubs
├── audit-report.md            # Policy-to-audit-log mapping
├── change-impact-report.md
├── framework-map.md
├── sprint-feed.md
├── staleness-report.md
├── enforcement-linkage.md
└── releases/
    ├── v1.0.md
    └── status-v1.0.md
```

**Stable IDs — never deleted, never reused:**

| Format | Example | Scope |
|---|---|---|
| `GP-NNN` | `GP-001`, `GP-012` | Guardrail Policies |
| `GC-NNN` | `GC-001`, `GC-003` | Guardrail Categories |
| `EV-NNN` | `EV-001`, `EV-005` | Enforcement Vectors |

---

## VS Code Commands

### Core
| Command | Who | What |
|---|---|---|
| `aigap: Initialize from Policy Doc` | Governance Lead | PDF/Word/MD → full `.aigap/` |
| `aigap: Update Policy` | Lead Engineer | Append new rule to POLICIES.md |
| `aigap: Generate Enforcement` | Developer | Generate enforcement stubs from policies |
| `aigap: Generate Release Notes` | Release Manager | git diff → policy ID mapped notes |
| `aigap: Show Traceability Matrix` | Anyone | Policy traceability tree view |
| `aigap: Show Gap Report` | Dev / Lead | Open file vs policy coverage |

### Analysis & Quality
| Command | What |
|---|---|
| `aigap: Analyse Change Impact` | Diff two policy versions → flag new/changed/removed |
| `aigap: Validate Policies` | Check structure, cross-refs, duplicate IDs |
| `aigap: Draft Pull Request Description` | git diff + policies → traceable PR |

### Delivery Tools
| Command | What |
|---|---|
| `aigap: Generate Sprint Feed` | POLICIES.md → TASK-NNN with story points |
| `aigap: Generate Audit Report` | Map policy IDs to audit log entries |
| `aigap: Generate Status Report` | Plain-English compliance status for leadership |
| `aigap: Map Compliance Frameworks` | Tag policies to EU AI Act / NIST / ISO 42001 / SOC 2 |

### Ingestion & Traceability
| Command | What |
|---|---|
| `aigap: Ingest from Confluence` | Fetch Confluence page + children via REST API |
| `aigap: Check Policy Staleness` | Cross-ref GP-XXX IDs against git log → flag drift |
| `aigap: Link Policies to Enforcement` | Scan enforcement files for ID mentions → coverage % |

### Copilot Chat — @aigap
```
@aigap what is GP-003?
@aigap tasks
@aigap coverage
@aigap rtm
```

---

## Three-Stage LLM Chain (Python CLI)

```
Policy + Dataset
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 1 — Classify  (claude-haiku-4-5)                     │
│  • Runs for every (rule × pair) — fast, cheap               │
│  • fast_patterns pre-filter short-circuits LLM when certain │
│  • Plugin fast_check() runs first if a plugin is registered │
│  • Returns: verdict (pass/fail/skip/error) + confidence     │
└────────────────────────┬────────────────────────────────────┘
                         │  FAIL verdicts only (~10–30%)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 2 — Analyze  (claude-sonnet-4-6)                     │
│  • Runs only for failed pairs                               │
│  • Returns: evidence quote, root cause, fix priority        │
└────────────────────────┬────────────────────────────────────┘
                         │  aggregated RuleResults
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 3 — Synthesize  (claude-opus-4-7)                    │
│  • Called once per run — receives compact JSON summary      │
│  • Returns: grade A–F, efficacy score, 3–5 recommendations  │
└─────────────────────────────────────────────────────────────┘
```

**Typical cost:** ~$0.39 per full run · ~$0.00 on cache hit (disk cache keyed by SHA1).

---

## Policy File (`.aigap-policy.yaml`)

```yaml
version: "1"
name: "Customer Support Bot"
block_on: [critical, high]       # severities that cause exit code 1
drift_threshold_pct: 5.0         # alert if any rule degrades > 5 percentage points

rules:
  - id: no-pii-leakage
    name: "No PII in responses"
    description: "Responses must not contain user PII."
    category: guardrail
    severity: critical
    plugin: "aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin"

  - id: no-competitor-mention
    name: "Never mention competitors"
    description: "Responses must not name competitor products."
    category: policy
    severity: high
    fast_patterns:
      - "(?i)(CompetitorA|CompetitorB)"
```

---

## Configuration

```json
// .vscode/settings.json
{
  "aigap.preferredModel": "claude-sonnet-4-6",
  "aigap.maxChunkTokens": 6000,
  "aigap.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

## CI/CD

```yaml
jobs:
  aigap-check:
    uses: org/aigap/.github/workflows/aigap-reusable.yml@main
```

The `--ci` flag writes a Markdown scorecard to `$GITHUB_STEP_SUMMARY`, visible directly in the PR Checks UI. Uses `ANTHROPIC_API_KEY` from repository secrets.

---

## Requirements

| | Option A | Option B | Python CLI |
|---|---|---|---|
| GitHub Copilot | Optional | Required (Business or Enterprise) | No |
| VS Code | Any | 1.85+ | No |
| Node.js | No | 18+ (build only) | No |
| Python | No | No | 3.11+ |
| API keys | None | None | `ANTHROPIC_API_KEY` |

---

## Development

```bash
git clone https://github.com/anirudhyadav/aigap
cd aigap
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with live API
export ANTHROPIC_API_KEY=sk-ant-...
aigap check . --policy .aigap-policy.yaml --dataset tests/fixtures/golden_dataset.jsonl
```

---

## Important: Review Before Committing

Option A prompt output must be reviewed before committing. The LLM may misclassify policies, merge categories that should be separate, or miss edge cases in complex policy documents.

1. Read generated POLICIES.md before committing
2. Resolve all items in the ambiguity report with the governance team
3. Never silently accept IDs — fix before they become load-bearing in enforcement stubs and audit trails
4. The `registry.json` ID counter must never be edited manually

---

## License

MIT — Author: Anirudh Yadav
