# aigap — AI Guardrails and Policies

> **Define once. Enforce everywhere. Audit always.**

`aigap` converts policy documents into versioned, enforced, auditable guardrail specs — and runs a
three-stage LLM chain (Haiku → Sonnet → Opus) to verify your AI system actually complies.

---

## Two delivery paths

| | Option A — MD Prompts | Option B — VS Code Extension |
|---|---|---|
| **Setup** | Zero — any LLM, any editor | Install extension, GitHub Copilot |
| **Workflow** | Copy prompt → paste policy doc → commit output | Command Palette or `@aigap` chat |
| **Output** | `.aigap/POLICIES.md` and living artefacts | Same `.aigap/` format, automated |
| **Best for** | Quick start, audits, one-off analysis | Daily dev workflow, CI/CD gate |

Both paths write to the same `.aigap/` folder. Start with Option A. Graduate to Option B when the team is ready.

---

## Quick start

### Option A — MD Prompts (zero setup)

```bash
# 1. Clone the repo
git clone https://github.com/anirudhyadav/aigap && cd aigap

# 2. Open prompts/define-policies.md in any LLM
#    Paste your policy document into the prompt
#    Commit the output → .aigap/POLICIES.md

# 3. Run the enforcer against your codebase
pip install aigap
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl
```

### Option B — VS Code Extension

```bash
# 1. Install from VSIX or marketplace
code --install-extension aigap-0.1.0.vsix

# 2. Open your project in VS Code
# 3. Ctrl+Shift+P → "aigap: Initialize from Policy Doc"
# 4. @aigap what policies are unenforced in this file?
```

---

## Repo structure

```
aigap/
├── .aigap/                        # Living artefacts (generated — commit this)
│   ├── registry.json              # ID counter — never reused
│   ├── POLICIES.md                # Versioned guardrail spec
│   ├── index.md                   # Policy traceability matrix
│   ├── gap-report.md              # Unenforced policies per file
│   ├── enforcement/               # Generated stubs and hooks
│   ├── audit-report.md            # Policy ID → audit event mapping
│   ├── change-impact-report.md    # Delta between policy versions
│   ├── framework-map.md           # EU AI Act / NIST / ISO 42001 coverage
│   ├── sprint-feed.md             # TASK-NNN enforcement cards
│   └── releases/                  # Release notes and status reports
├── aigap/                         # Python package — CLI + pipeline
│   ├── cli.py
│   ├── pipeline/                  # Haiku → Sonnet → Opus chain
│   ├── plugins/builtins/          # PII · injection · jailbreak · harm · competitor
│   ├── scoring/                   # Coverage · efficacy · drift
│   └── server/                    # FastAPI + dashboard
├── prompts/                       # Option A — MD prompt templates
│   ├── README.md
│   ├── define-policies.md         # ← start here
│   ├── update-policy.md
│   ├── validate-policies.md
│   ├── gap-analysis.md
│   ├── generate-enforcement.md
│   ├── audit-report.md
│   ├── change-impact.md
│   ├── framework-map.md
│   ├── pr-description.md
│   ├── release-notes.md
│   ├── po-status-report.md
│   └── sprint-feed.md
├── vscodebase/                    # Option B — VS Code extension (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/extension.ts
├── tests/
├── examples/
├── FEATURES.md
├── PLAYBOOK.md
└── DECK_BRIEF.md
```

---

## CLI commands

| Command | Purpose |
|---|---|
| `aigap check [TARGET]` | Run full guardrail + policy evaluation |
| `aigap init` | Scaffold `.aigap-policy.yaml` and example dataset |
| `aigap baseline save` | Save current run as drift baseline |
| `aigap baseline diff` | Compare two baseline files |
| `aigap baseline show` | Print current baseline summary |
| `aigap rules` | List all built-in and plugin rules |
| `aigap serve` | Start FastAPI backend + web dashboard |

### `aigap check` options

```
--policy  / -p   PATH    Policy YAML file          [default: .aigap-policy.yaml]
--dataset / -d   PATH    Golden dataset JSONL/YAML
--output  / -o   PATH    Write JSON report to path
--format         FORMAT  markdown|json|both         [default: both]
--baseline       PATH    Compare to baseline (drift report)
--fail-on        LEVEL   Exit 1 if rule at this severity fails [default: high]
--concurrency    INT     Parallel API calls         [default: 10]
--no-cache               Disable result cache
--ci                     Emit GitHub Actions step summary
```

---

## VS Code commands

| Command ID | Title | Who |
|---|---|---|
| `aigap.init` | aigap: Initialize from Policy Doc | Lead Engineer |
| `aigap.update` | aigap: Add New Guardrail | Engineer |
| `aigap.validate` | aigap: Validate POLICIES.md | Tech Lead |
| `aigap.gapReport` | aigap: Show Gap Report | Developer |
| `aigap.enforcement` | aigap: Generate Enforcement Stubs | Developer |
| `aigap.auditReport` | aigap: Generate Audit Report | Compliance Mgr |
| `aigap.changeImpact` | aigap: Analyse Policy Change Impact | Lead Engineer |
| `aigap.frameworkMap` | aigap: Map Regulation Frameworks | Compliance Mgr |
| `aigap.sprintFeed` | aigap: Generate Sprint Feed | Scrum Master |
| `aigap.prDraft` | aigap: Draft Pull Request Description | Developer |
| `aigap.releaseNotes` | aigap: Generate Release Notes | Release Mgr |
| `aigap.statusReport` | aigap: Generate Policy Status Report | Leadership |
| `aigap.staleness` | aigap: Check Policy Staleness | Lead Engineer |
| `aigap.testLinkage` | aigap: Link Policies to Test Files | QA |
| `aigap.ingestConfluence` | aigap: Ingest from Confluence | Tech Lead |

Chat participant: `@aigap` — ask anything about your policy coverage in natural language.

---

## Stable ID reference

Every entity tracked by aigap carries a stable `TYPE-NNN` ID. IDs are assigned sequentially,
never reused, and never deleted — only deprecated.

| Type | Full Name | Example |
|---|---|---|
| `GP` | Guardrail Policy | `GP-001: No PII in prompt` |
| `GC` | Guardrail Category | `GC-001: Data Privacy` |
| `EV` | Enforcement Vector | `EV-001: pre-call hook` |
| `FR` | Framework Reference | `FR-001: EU AI Act Art.13` |

---

## Configuration

| Key | Type | Default | Description |
|---|---|---|---|
| `aigap.preferredModel` | string | `"claude-sonnet-4-6"` | Copilot model for policy analysis |
| `aigap.maxChunkTokens` | number | `6000` | Max tokens per policy chunk |
| `aigap.confluenceBaseUrl` | string | `""` | Confluence base URL for ingestion |
| `aigap.strictMode` | boolean | `false` | Fail CI on any unenforced GP-XXX |
| `aigap.auditRetentionDays` | number | `90` | Days to retain audit log entries |

---

## CI/CD

```yaml
# .github/workflows/aigap-ci.yaml
- name: aigap policy gap check
  run: |
    aigap check . \
      --policy .aigap-policy.yaml \
      --dataset tests/golden_dataset.jsonl \
      --baseline aigap-baseline.json \
      --ci --fail-on high --output aigap-report.json
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

On every PR: fails if any `GP-XXX` in changed files has no enforcement stub; posts policy
coverage summary as a PR comment. Uses `ANTHROPIC_API_KEY` only.

---

## Three-stage LLM chain

```
Policy + Dataset
      │
      ▼
Stage 1 — Classify   (claude-haiku-4-5)    every (rule × pair), cached
      │  FAIL only
      ▼
Stage 2 — Analyze    (claude-sonnet-4-6)   evidence + root cause + fix
      │  aggregated
      ▼
Stage 3 — Synthesize (claude-opus-4-7)     grade A–F, score, recommendations
```

Haiku rule prompts use `cache_control: ephemeral` (~80% cost reduction on repeated pairs).
Stage 2 skipped for passing pairs. Stage 3 receives aggregated JSON only.

---

## Installation

```bash
pip install aigap        # requires Python ≥ 3.11 + ANTHROPIC_API_KEY
```

---

## License

MIT · [github.com/anirudhyadav/aigap](https://github.com/anirudhyadav/aigap) · No API keys required for Option A (MD prompts)
