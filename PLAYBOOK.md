# PLAYBOOK — aigap VS Code Extension

Step-by-step guide for Option B: the aigap VS Code extension.

> **Option A user?** See `prompts/README.md` for the MD prompt path. Both paths produce the same `.aigap/` output.

---

## Installation

### From VSIX (local build)

```bash
cd vscode-extension
npm install
npm run compile
code --install-extension aigap-0.1.0.vsix
```

### From Marketplace (when published)

Search "aigap" in the VS Code Extensions panel or:

```bash
code --install-extension anirudhyadav.aigap
```

### Prerequisites

- VS Code ≥ 1.90
- GitHub Copilot extension (for `@aigap` chat participant)
- `ANTHROPIC_API_KEY` set in environment (for CLI commands that shell out)

---

## Getting started

1. Open your project folder in VS Code
2. `Ctrl+Shift+P` → **aigap: Initialize from Policy Doc**
3. Select your policy document (PDF, Word, or Markdown)
4. Wait — the extension calls Copilot and writes `.aigap/POLICIES.md`
5. Commit `.aigap/` to git

From this point every command reads from and writes to `.aigap/`.

---

## All commands

### `aigap.init` — Initialize from Policy Doc

**Who:** Lead Engineer  
**When:** First time setting up aigap on a project, or after a major policy overhaul.

Steps:
1. `Ctrl+Shift+P` → **aigap: Initialize from Policy Doc**
2. A file picker opens — select your policy document
3. The extension extracts GC/GP/EV entities and assigns stable IDs
4. Writes `.aigap/POLICIES.md` and `.aigap/registry.json`
5. Opens the new POLICIES.md in a diff view for review

Output: `.aigap/POLICIES.md`, `.aigap/registry.json`

---

### `aigap.update` — Add New Guardrail

**Who:** Engineer  
**When:** A new policy requirement arrives mid-sprint.

Steps:
1. `Ctrl+Shift+P` → **aigap: Add New Guardrail**
2. Enter the policy name and description in the input box
3. Select a category (GC-XXX) from the quick-pick list
4. Select severity: critical / high / medium / low
5. The extension assigns the next `GP-NNN` from `registry.json`
6. Appends the entry to `.aigap/POLICIES.md`

Output: `.aigap/POLICIES.md` (appended)

---

### `aigap.validate` — Validate POLICIES.md

**Who:** Tech Lead  
**When:** Before a PR merge or sprint review.

Steps:
1. `Ctrl+Shift+P` → **aigap: Validate POLICIES.md**
2. The extension checks: duplicate IDs, missing fields, orphaned categories
3. Problems panel shows any issues as warnings/errors
4. Writes `.aigap/index.md` (traceability matrix) on success

Output: Problems panel, `.aigap/index.md`

---

### `aigap.gapReport` — Show Gap Report

**Who:** Developer  
**When:** Before raising a PR — confirm all referenced policies have stubs.

Steps:
1. Open the file you want to check (or leave no file open for project-wide scan)
2. `Ctrl+Shift+P` → **aigap: Show Gap Report**
3. A webview panel opens listing every `GP-NNN` that has no enforcement stub
4. Click any row to jump to the relevant line in source

Output: `.aigap/gap-report.md`, webview panel

---

### `aigap.enforcement` — Generate Enforcement Stubs

**Who:** Developer  
**When:** After defining policies — generate the boilerplate hooks.

Steps:
1. `Ctrl+Shift+P` → **aigap: Generate Enforcement Stubs**
2. Select target language from quick-pick (Python / TypeScript / Java)
3. Select which policies (GP-NNN) to generate stubs for
4. Stubs are written to `.aigap/enforcement/`
5. A diff view shows each new stub file

Output: `.aigap/enforcement/*.py` (or `.ts`, `.java`)

---

### `aigap.auditReport` — Generate Audit Report

**Who:** Compliance Manager  
**When:** After a production run — map audit log entries to policy IDs.

Steps:
1. `Ctrl+Shift+P` → **aigap: Generate Audit Report**
2. Select the audit log file (JSON or JSONL)
3. The extension maps each log entry to a `GP-NNN` using pattern matching
4. Writes `.aigap/audit-report.md`

Output: `.aigap/audit-report.md`

---

### `aigap.changeImpact` — Analyse Policy Change Impact

**Who:** Lead Engineer  
**When:** The policy document has been updated — before deploying new enforcement.

Steps:
1. `Ctrl+Shift+P` → **aigap: Analyse Policy Change Impact**
2. Select the old policy document version
3. Select the new policy document version (or use current `.aigap/POLICIES.md`)
4. The extension diffs the two versions at the GP/GC level
5. Writes `.aigap/change-impact-report.md`

Output: `.aigap/change-impact-report.md`

---

### `aigap.frameworkMap` — Map Regulation Frameworks

**Who:** Compliance Manager  
**When:** Preparing for a regulatory audit or certification.

Steps:
1. `Ctrl+Shift+P` → **aigap: Map Regulation Frameworks**
2. Select frameworks: EU AI Act / NIST AI RMF / ISO 42001 / GDPR Art.22
3. The extension maps each `GP-NNN` to relevant clauses with `FR-NNN` IDs
4. Writes `.aigap/framework-map.md`

Output: `.aigap/framework-map.md`

---

### `aigap.sprintFeed` — Generate Sprint Feed

**Who:** Scrum Master  
**When:** Sprint planning — convert unenforced policies into backlog tasks.

Steps:
1. `Ctrl+Shift+P` → **aigap: Generate Sprint Feed**
2. The extension reads `.aigap/gap-report.md` (run gap report first)
3. Converts each gap into a `TASK-NNN` card with story points
4. Writes `.aigap/sprint-feed.md`

Output: `.aigap/sprint-feed.md`

---

### `aigap.prDraft` — Draft Pull Request Description

**Who:** Developer  
**When:** Before pushing a PR — generate a traceable PR body.

Steps:
1. `Ctrl+Shift+P` → **aigap: Draft Pull Request Description**
2. The extension reads `git diff` + `.aigap/POLICIES.md`
3. Generates a PR body with: summary, affected `GP-NNN` IDs, enforcement evidence
4. Opens result in a new editor tab (copy to GitHub/GitLab)

Output: New editor tab with PR body

---

### `aigap.releaseNotes` — Generate Release Notes

**Who:** Release Manager  
**When:** Before tagging a release — generate policy-mapped release notes.

Steps:
1. `Ctrl+Shift+P` → **aigap: Generate Release Notes**
2. Enter the version tag (e.g. `v1.2.0`)
3. The extension maps commits since last tag to `GP-NNN` IDs
4. Writes `.aigap/releases/v1.2.0.md`

Output: `.aigap/releases/vN.md`

---

### `aigap.statusReport` — Generate Policy Status Report

**Who:** Leadership / PO  
**When:** Weekly or sprint review — plain-English compliance summary.

Steps:
1. `Ctrl+Shift+P` → **aigap: Generate Policy Status Report**
2. Enter the version label
3. The extension calculates: policies defined, enforced, tested, framework-mapped
4. Writes `.aigap/releases/status-vN.md`

Output: `.aigap/releases/status-vN.md`

---

### `aigap.staleness` — Check Policy Staleness

**Who:** Lead Engineer  
**When:** Quarterly review — find policies whose enforcement hasn't been touched in N commits.

Steps:
1. `Ctrl+Shift+P` → **aigap: Check Policy Staleness**
2. The extension scans `git log` for `GP-NNN` references
3. Flags policies not referenced in recent commits
4. Opens a webview panel sorted by staleness age

Output: Webview panel

---

### `aigap.testLinkage` — Link Policies to Test Files

**Who:** QA  
**When:** Before a release — confirm every `GP-NNN` has a test.

Steps:
1. `Ctrl+Shift+P` → **aigap: Link Policies to Test Files**
2. The extension scans the test directory for `GP-NNN` mentions
3. Shows a table: GP-NNN | Test file | Covered (✅/❌)
4. Appends results to `.aigap/index.md`

Output: `.aigap/index.md` (updated)

---

### `aigap.ingestConfluence` — Ingest from Confluence

**Who:** Tech Lead  
**When:** Policy lives in Confluence — pull it into POLICIES.md without copy-paste.

Steps:
1. Set `aigap.confluenceBaseUrl` in VS Code settings
2. `Ctrl+Shift+P` → **aigap: Ingest from Confluence**
3. Enter the Confluence page ID or URL
4. The extension fetches via REST API and runs `aigap.init` on the result

Output: `.aigap/POLICIES.md`

---

## `@aigap` chat participant

Use in GitHub Copilot Chat (Ctrl+Shift+I):

```
@aigap what policies cover data privacy?
@aigap is GP-007 enforced in src/api/chat.py?
@aigap show me all unenforced critical policies
@aigap which policies map to EU AI Act Article 13?
@aigap generate a sprint task for GP-012
```

The participant reads `.aigap/POLICIES.md` and the current workspace to answer.

---

## `.aigap/` folder format

### `registry.json`

```json
{
  "GP": 12,
  "GC": 4,
  "EV": 8,
  "FR": 6,
  "lastUpdated": "2026-05-03T10:00:00Z"
}
```

The counter is the **last assigned** number. Next ID = counter + 1. Never decrement.

### `POLICIES.md` structure

```markdown
# POLICIES — aigap
version: 0.1.0 · updated: 2026-05-03

## GC-001: Data Privacy
| ID | Name | Severity | Enforcement Vector | Status |
|---|---|---|---|---|
| GP-001 | No PII in prompt | critical | EV-001: pre-call hook | ✅ enforced |
| GP-002 | Mask PII in response | high | EV-002: output filter | 🔲 gap |

## GC-002: Safety
...
```

### ID assignment rules

1. Read `registry.json` for the type counter
2. Increment by 1 → that is the new ID
3. Write the new entry to `POLICIES.md`
4. Update `registry.json` counter
5. Never skip numbers. Never reuse a number. Deprecated entries keep their ID marked `[DEPRECATED]`.

---

## Configuration reference

Set in VS Code Settings (`Ctrl+,` → search "aigap"):

| Setting | Default | Description |
|---|---|---|
| `aigap.preferredModel` | `claude-sonnet-4-6` | Copilot model for analysis |
| `aigap.maxChunkTokens` | `6000` | Max tokens per policy chunk |
| `aigap.confluenceBaseUrl` | `""` | Confluence base URL |
| `aigap.strictMode` | `false` | Fail CI on any unenforced GP-XXX |
| `aigap.auditRetentionDays` | `90` | Days to retain audit log entries |

---

## CI/CD setup

1. Add `.aigap/` to version control (not `.gitignore`)
2. Add the workflow:

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
      - name: Run policy gap check
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --baseline aigap-baseline.json \
            --ci --fail-on high --output aigap-report.json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

3. Add `ANTHROPIC_API_KEY` to GitHub repository secrets
4. Enable `aigap.strictMode` if you want CI to fail on any unenforced `GP-XXX`

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `registry.json not found` | Run `aigap.init` first — it creates the file |
| `Duplicate ID GP-NNN` | Run `aigap.validate` — it will flag and suggest the next available ID |
| `@aigap not available in chat` | Ensure GitHub Copilot Chat extension is installed and signed in |
| Confluence ingest 401 error | Check `aigap.confluenceBaseUrl` and that your Confluence token is set |
| `aigap check` not found | Run `pip install aigap` in the terminal; ensure Python ≥ 3.11 |
| Stubs generated in wrong language | Check active file language when running `aigap.enforcement` |
