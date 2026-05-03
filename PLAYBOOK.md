# aigap Playbook — VS Code Extension

**Practical guide for every role — from onboarding to release.**

This playbook covers the **VS Code Extension** (GitHub Enterprise + Copilot). For the standalone Python CLI and library, see the [CLI sections below](#7-cicd-setup) or the [README](README.md).

---

## Which Tool Should I Use?

| Situation | Use |
|---|---|
| Org team on GitHub Enterprise with Copilot | **This playbook** — VS Code Extension |
| Personal repo, any machine, any LLM key | Python CLI or Option A prompts |
| CI/CD pipeline, scripting, automation | Python CLI |
| Exploring aigap without VS Code | Python CLI or Option A prompts |

Both tools produce the same `.aigap/` output format and are fully compatible on the same repo.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Governance Lead — Project Onboarding](#2-governance-lead--project-onboarding)
3. [Lead Engineer — Updating Policies](#3-lead-engineer--updating-policies)
4. [Developer — Daily Usage](#4-developer--daily-usage)
5. [QA / Tester — Generating Enforcement Stubs](#5-qa--tester--generating-enforcement-stubs)
6. [Release Manager — Release Notes](#6-release-manager--release-notes)
7. [Quality & Analysis Commands](#7-quality--analysis-commands)
8. [Delivery Tools](#8-delivery-tools)
9. [Ingestion & Traceability](#9-ingestion--traceability)
10. [Understanding the .aigap/ Folder](#10-understanding-the-aigap-folder)
11. [Stable ID Reference](#11-stable-id-reference)
12. [POLICIES.md Structure](#12-policiesmd-structure)
13. [Copilot Chat — @aigap Reference](#13-copilot-chat--aigap-reference)
14. [CI/CD — GitHub Actions Setup](#14-cicd--github-actions-setup)
15. [Python CLI Reference](#15-python-cli-reference)
16. [Plugin Development](#16-plugin-development)
17. [Dashboard](#17-dashboard)
18. [Configuration Reference](#18-configuration-reference)
19. [Troubleshooting](#19-troubleshooting)
20. [Quick Reference Card](#20-quick-reference-card)

---

## 1. Prerequisites

Before using aigap, ensure the following:

| Requirement | Check |
|---|---|
| VS Code 1.85+ installed | `code --version` |
| GitHub Copilot extension active | Copilot icon visible in status bar |
| Copilot signed in with org account | Settings → Copilot → Signed in |
| aigap extension installed | Extensions panel → search "aigap" |
| Workspace folder open in VS Code | File → Open Folder |
| Project is a git repository | `.git/` folder exists at root |

**aigap uses your existing Copilot license. No additional API keys or accounts needed.**

For the Python CLI (runtime checks), you also need:
- Python 3.11+
- `ANTHROPIC_API_KEY` environment variable

---

## 2. Governance Lead — Project Onboarding

This is a one-time step per project. Run it once, commit the output, and your team has a living guardrail spec.

### Step 1 — Prepare the Policy Document

Export your policy document from Confluence/SharePoint in one of these formats:

| Format | Notes |
|---|---|
| `.pdf` | Best for finalized policy documents |
| `.docx` / `.doc` | Best for editable Word documents |
| `.md` | If already in Markdown |
| Confluence page | Use `aigap: Ingest from Confluence` directly (no file needed) |

### Step 2 — Run Initialize

1. Open the project repo in VS Code
2. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Type and select: **`aigap: Initialize from Policy Doc`**
4. A file picker opens — select your policy document
5. A progress notification appears while aigap processes the document

**What happens during initialization:**

```
Parse policy document
    ↓
Extract: guardrail categories · guardrail policies · enforcement vectors
    ↓
Assign stable IDs to every item (e.g. GP-001, GC-002, EV-003)
    ↓
Generate:
  POLICIES.md            ← structured living guardrail spec
  index.md               ← traceability matrix
  ambiguity-report.md    ← vague terms flagged
  conflict-report.md     ← contradicting rules flagged
    ↓
Show results panel
```

### Step 3 — Review Generated Files

After initialization, open `.aigap/` and review:

- **`POLICIES.md`** — check that categories, policies, and enforcement vectors are correctly extracted
- **`ambiguity-report.md`** — resolve flagged terms with the governance team before development starts
- **`conflict-report.md`** — escalate conflicting rules immediately

Run a validation pass:

**Command Palette → `aigap: Validate Policies`**

This checks cross-references, duplicate IDs, and missing fields before anything is committed.

### Step 4 — Commit to Git

```bash
git add .aigap/
git commit -m "feat: initialize aigap living guardrail spec from policy doc v1.0"
```

The `.aigap/` folder is now version-controlled alongside your code. Every team member has access to the spec.

### Step 5 — Add to CI

Add the reusable workflow to your repo (see [Section 14](#14-cicd--github-actions-setup)).

---

## 3. Lead Engineer — Updating Policies

When the governance team brings new rules (via email, Jira, Confluence, or verbal), the Lead Engineer is responsible for keeping POLICIES.md current.

### Running the Update Command

1. Collect the new rule from the governance team in plain text
2. Open Command Palette → **`aigap: Update Policy`**
3. A text input box appears — paste or type the rule
4. aigap will:
   - Extract the policy rule and enforcement vector
   - Assign new stable IDs (continuing from the registry)
   - Append to POLICIES.md
   - Add a changelog entry with the date and version

### Analysing Change Impact Before Updating

When a significantly revised policy document arrives, run **`aigap: Analyse Change Impact`** first:

1. Command Palette → **`aigap: Analyse Change Impact`**
2. File picker opens — select the new policy document version
3. aigap compares it to the existing POLICIES.md and produces a report:
   - Rules that have changed scope
   - Rules that appear to have been removed
   - Entirely new rules not yet in the spec

Review `.aigap/change-impact-report.md` with the governance team before committing any updates.

### Example Input (Update Command)

```
AI responses must never include cryptocurrency investment advice.
This applies to all customer-facing channels. Severity: high.
Enforcement: output filter on response pipeline.
```

### Example Output (appended to POLICIES.md)

```markdown
| GP-014 | No crypto advice | AI responses must never include cryptocurrency investment advice. Applies to all customer-facing channels. | high | EV-002 | 🔲 gap |

- 2026-05-03 v1.4: GP-014 added (governance team via lead engineer)
```

### Commit the Update

```bash
git add .aigap/
git commit -m "policy: add no-crypto-advice rule — GP-014"
```

**Convention:** Reference the policy ID in your commit message. This creates a permanent audit trail.

---

## 4. Developer — Daily Usage

### Using @aigap in Copilot Chat

Open Copilot Chat in VS Code (`Ctrl+Shift+I` / `Cmd+Shift+I`) and mention `@aigap`:

#### Get details on a specific policy

```
@aigap what is GP-003?
```
Returns: full policy description, severity, enforcement vector, and status.

```
@aigap explain GC-002
```
Returns: the category, all policies under it, and their enforcement status.

#### Find out what to enforce

```
@aigap tasks
```
Returns: a prioritized list of enforcement tasks derived from POLICIES.md, with the policy IDs to satisfy for each task.

#### Ask free-form questions

```
@aigap what are the rules around PII?
@aigap which policies involve the output filter vector?
@aigap are there any critical severity rules without enforcement?
```

### Check Coverage on Your Current File

1. Open the file you are working on
2. Open Command Palette → **`aigap: Show Gap Report`**

Or in Copilot Chat:
```
@aigap coverage
```

Returns a gap report showing which policies are enforced, partially enforced, or missing in the selected code.

### Auto-generate Your PR Description

Before opening a pull request:

1. Command Palette → **`aigap: Draft Pull Request Description`**
2. aigap reads the git diff against `main`, maps it to policy IDs, and generates:
   - **What Changed** — plain English bullet list
   - **Policies Covered** — traced GP-XXX IDs
   - **Enforcement Coverage** — which enforcement stubs cover the changes
   - **Notes for Reviewer** — trade-offs and edge cases

Copy the output into your PR description.

### Using the Traceability Tree View

The **aigap Traceability** panel appears in the Explorer sidebar. It shows:
- All guardrail categories
- All policies under each category
- Click any policy to open its POLICIES.md at that line

Refresh it with: Command Palette → **`aigap: Show Traceability Matrix`**

---

## 5. QA / Tester — Generating Enforcement Stubs

### Run Generate Enforcement

1. Open Command Palette → **`aigap: Generate Enforcement`**
2. Enforcement stubs are written to `.aigap/enforcement/`

### Output Format

Each enforcement stub traces back to its source policy ID:

```markdown
## EV-001: Pre-call Hook — GP-001 (No PII Leakage)

```python
def check_no_pii(prompt: str) -> bool:
    """Pre-call hook: reject prompts requesting PII."""
    pii_patterns = [r'\b\d{3}-\d{2}-\d{4}\b', r'\b\d{16}\b']
    return not any(re.search(p, prompt) for p in pii_patterns)
```

### Running Python CLI Tests

For comprehensive testing using the three-stage LLM pipeline:

```bash
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl
```

---

## 6. Release Manager — Release Notes

### Run Generate Release Notes

1. Command Palette → **`aigap: Generate Release Notes`**
2. Enter version number (e.g. `v1.2.0`)
3. Enter git range (e.g. `HEAD~20..HEAD`)
4. aigap maps code changes to policy IDs and generates release notes
5. Saved to `.aigap/releases/v1.2.0.md`

### Generate a Status Report for Leadership

1. Command Palette → **`aigap: Generate Status Report`**
2. Produces a plain-English compliance status document
3. Saved to `.aigap/releases/status-v1.2.0.md`

---

## 7. Quality & Analysis Commands

| Command | What it does |
|---|---|
| `aigap: Analyse Change Impact` | Diff two policy versions → flag new/changed/removed |
| `aigap: Validate Policies` | Check structure, cross-refs, duplicate IDs |
| `aigap: Draft Pull Request Description` | git diff + policies → traceable PR |

---

## 8. Delivery Tools

| Command | What it does |
|---|---|
| `aigap: Generate Sprint Feed` | POLICIES.md → TASK-NNN with story points |
| `aigap: Generate Audit Report` | Map policy IDs to audit log entries |
| `aigap: Map Compliance Frameworks` | Tag policies to EU AI Act / NIST / ISO 42001 / SOC 2 |

---

## 9. Ingestion & Traceability

| Command | What it does |
|---|---|
| `aigap: Ingest from Confluence` | Fetch Confluence page + children via REST API |
| `aigap: Check Policy Staleness` | Cross-ref GP-XXX IDs against git log → flag drift |
| `aigap: Link Policies to Enforcement` | Scan enforcement files for ID mentions → coverage % |

---

## 10. Understanding the .aigap/ Folder

```
.aigap/
├── registry.json              # ID counter — never reused
├── POLICIES.md                # Living guardrail spec
├── index.md                   # Policy traceability matrix
├── ambiguity-report.md        # Vague terms flagged for governance resolution
├── conflict-report.md         # Contradicting rules flagged
├── gap-report.md
├── change-impact-report.md
├── framework-map.md
├── sprint-feed.md
├── staleness-report.md
├── enforcement-linkage.md
├── enforcement/               # Generated enforcement stubs
│   ├── pre-call-hooks.md
│   └── output-filters.md
├── audit-report.md
└── releases/
    ├── v1.0.md
    └── status-v1.0.md
```

---

## 11. Stable ID Reference

| Format | Example | Scope |
|---|---|---|
| `GP-NNN` | `GP-001`, `GP-012` | Guardrail Policies |
| `GC-NNN` | `GC-001`, `GC-003` | Guardrail Categories |
| `EV-NNN` | `EV-001`, `EV-005` | Enforcement Vectors |
| `FR-NNN` | `FR-001` | Framework References |
| `TASK-NNN` | `TASK-001` | Sprint Tasks |

**Rules:**
1. IDs are sequential with zero-padding: `GP-001`, `GP-012`, `GP-123`
2. The registry counter holds the **last assigned** number
3. Never skip numbers
4. Never reuse a number — even if a policy is deprecated (mark it `[DEPRECATED]`)
5. Never renumber existing IDs

---

## 12. POLICIES.md Structure

```markdown
# POLICIES — [PROJECT NAME]
<!-- aigap v0.1.0 · generated · [DATE] -->

version: [VERSION]
updated: [DATE]
author: [AUTHOR]

---

## Summary

| Type | Count |
|---|---|
| Guardrail Categories (GC) | [N] |
| Guardrail Policies (GP) | [N] |
| Enforcement Vectors (EV) | [N] |

---

## Enforcement Vectors

| ID | Type | Description |
|---|---|---|
| EV-001 | pre-call hook | Runs before the LLM call |
| EV-002 | output filter | Runs after the LLM response |

---

## [GC-001: Category Name]

[One-line category description.]

| ID | Name | Description | Severity | Vector | Status |
|---|---|---|---|---|---|
| GP-001 | [Name] | [Description] | critical | EV-001 | 🔲 gap |
| GP-002 | [Name] | [Description] | high | EV-002 | 🔲 gap |
```

**Status values:**
- `🔲 gap` — policy defined but no enforcement stub exists yet
- `✅ enforced` — enforcement stub committed and passing
- `⚠️ partial` — stub exists but test coverage is incomplete
- `[DEPRECATED]` — policy removed from scope (ID kept forever)

---

## 13. Copilot Chat — @aigap Reference

```
@aigap help             ← show available commands
@aigap what is GP-003?  ← look up any policy by ID
@aigap tasks            ← list open enforcement tasks
@aigap coverage         ← coverage % for current file
@aigap rtm              ← refresh traceability matrix
```

| Query | What it does |
|---|---|
| `@aigap <ID>` or `@aigap analyze <ID>` | Explain a specific policy, category, or vector |
| `@aigap tasks` | List prioritised enforcement tasks from POLICIES.md |
| `@aigap coverage` | Gap report for current file or module |
| `@aigap rtm` | Show traceability matrix summary |

---

## 14. CI/CD — GitHub Actions Setup

### Using the Reusable Workflow

Add to your consumer repo:

```yaml
# .github/workflows/aigap-check.yml
name: aigap Policy Check
on: [pull_request]

jobs:
  aigap-check:
    uses: anirudhyadav/aigap/.github/workflows/aigap-reusable.yml@main
```

### Full CI Setup (with Python CLI)

```yaml
# .github/workflows/aigap-ci.yaml
name: aigap policy check
on: [pull_request]

jobs:
  policy-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install aigap

      - name: Run aigap check
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --baseline aigap-baseline.json \
            --ci --fail-on high \
            --output aigap-report.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: aigap-report
          path: aigap-report.json
```

### Caching API Results Between Runs

```yaml
- uses: actions/cache@v4
  with:
    path: .aigap_cache
    key: aigap-cache-${{ hashFiles('.aigap-policy.yaml', 'tests/golden_dataset.jsonl') }}
```

### Recommended CI Policy

- Set `fail-on: high` for PRs — blocks on safety violations
- Set `fail-on: critical` for production deployments — only hard blocks
- Keep `drift_threshold_pct: 5.0` in your policy for drift alerts in the step summary

---

## 15. Python CLI Reference

### `aigap check [TARGET]`

Run the full three-stage pipeline.

```
--policy  / -p   PATH     Policy YAML file          [default: .aigap-policy.yaml]
--dataset / -d   PATH     Golden dataset JSONL/YAML
--output  / -o   PATH     Write JSON report to this path
--format         FORMAT   markdown | json | both     [default: both]
--baseline       PATH     Compare to baseline (adds drift report)
--fail-on        LEVEL    Exit 1 if a rule at this severity fails [default: high]
--concurrency    INT      Parallel Anthropic API calls [default: 10]
--no-cache                Disable disk + memory cache
--dry-run                 Load policy + dataset, skip API calls
--ci                      Write Markdown scorecard to $GITHUB_STEP_SUMMARY
--verbose                 Print per-pair results to stdout
```

### `aigap init`

Scaffold a starter policy file and golden dataset.

### `aigap baseline`

```
aigap baseline save [--report PATH]   # Save current report as baseline
aigap baseline show                   # Print current baseline summary
```

### `aigap rules`

List all rules resolved from the policy file.

### `aigap serve`

Start the FastAPI backend and web dashboard (`http://localhost:7823`).

### `aigap version`

Print the installed version.

---

## 16. Plugin Development

### Plugin Interface

```python
from aigap.plugins.base import FastCheckResult, PolicyPlugin
from aigap.models.policy import PolicyRule
from aigap.models.dataset import GoldenPair

class MyPlugin(PolicyPlugin):
    rule_id = "my-rule"

    def fast_check(self, rule: PolicyRule, pair: GoldenPair) -> FastCheckResult | None:
        if "banned_word" in pair.response.lower():
            return FastCheckResult(
                verdict=False,
                confidence=0.99,
                rationale="Banned word found",
                evidence="banned_word",
            )
        return None

    def on_failure(self, rule: PolicyRule, pair: GoldenPair, result) -> None:
        pass
```

### Registering a Plugin

```toml
# pyproject.toml
[project.entry-points."aigap.plugins"]
my_plugin = "my_package.rules:MyPlugin"
```

Then reference in YAML: `plugin: "my_plugin"`

### Plugin Params

```yaml
- id: no-competitor-mention
  plugin: "aigap.plugins.builtins.competitor_mention:CompetitorMentionPlugin"
  params:
    competitors: ["AcmeCorp", "BetaCo", "Gamma Ltd"]
    flag_comparison_language: true
```

---

## 17. Dashboard

```bash
aigap serve     # → http://localhost:7823
```

| Section | What it shows |
|---|---|
| **Efficacy Hero** | Grade (A–F), score (0–100), Coverage %, FPR %, FNR %, Strength label |
| **Stats row** | Passing rules / Failing rules / Overall drift delta |
| **Rules table** | All rules with pass-rate bar, verdict badge, drift arrow |
| **Detail panel** | FP count, FN count, failure cards with evidence + root cause + fix priority |
| **Recommendations** | 3–5 prioritised actions from Opus Stage 3 |

Dashboard connects via SSE and updates cell-by-cell during a live `aigap check` run.

---

## 18. Configuration Reference

```json
// .vscode/settings.json
{
  "aigap.preferredModel": "claude-sonnet-4-6",
  "aigap.maxChunkTokens": 6000,
  "aigap.confluenceBaseUrl": "https://yourorg.atlassian.net"
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `aigap.preferredModel` | string | `claude-sonnet-4-6` | Copilot model for policy analysis |
| `aigap.maxChunkTokens` | number | `6000` | Max tokens per policy chunk sent to LLM |
| `aigap.confluenceBaseUrl` | string | `""` | Default Confluence base URL |

---

## 19. Troubleshooting

| Symptom | Fix |
|---|---|
| `ANTHROPIC_API_KEY not set` | `export ANTHROPIC_API_KEY=sk-ant-...` (Python CLI only) |
| `PolicyConfig validation error` | Run `aigap check --dry-run` to validate YAML without API calls |
| Rate limit errors | Lower `--concurrency` (try `--concurrency 3`) |
| No `.aigap/` folder | Run `aigap: Initialize from Policy Doc` first |
| Dashboard shows mock data | No run completed yet — run `aigap check` first |
| `fast_patterns` not matching | Test regex in Python: `re.search(pattern, text)` |
| Baseline not found | Run `aigap baseline save` after your first successful check |
| Plugin not loading | Check entry point path and run `aigap rules` to see which plugins resolved |
| VS Code extension not activating | Ensure VS Code 1.85+ and the extension is installed |

---

## 20. Quick Reference Card

| Task | Command |
|---|---|
| **Bootstrap from policy doc** | `aigap: Initialize from Policy Doc` |
| **Add a new rule** | `aigap: Update Policy` |
| **Check for gaps** | `aigap: Show Gap Report` or `@aigap coverage` |
| **Generate enforcement** | `aigap: Generate Enforcement` |
| **Validate policies** | `aigap: Validate Policies` |
| **Sprint tasks** | `aigap: Generate Sprint Feed` |
| **PR description** | `aigap: Draft Pull Request Description` |
| **Release notes** | `aigap: Generate Release Notes` |
| **Status report** | `aigap: Generate Status Report` |
| **Audit report** | `aigap: Generate Audit Report` |
| **Framework mapping** | `aigap: Map Compliance Frameworks` |
| **Compliance check (CLI)** | `aigap check . -p policy.yaml -d dataset.jsonl` |
| **Dashboard** | `aigap serve` |
| **Copilot Chat** | `@aigap <question>` |
