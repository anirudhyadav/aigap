# Option A — MD Prompt Templates

Zero-setup delivery path for aigap. Copy a prompt, paste your context, run it in any LLM.
Output always lands in `.aigap/` — commit it alongside your code.

> **VS Code user?** See `PLAYBOOK.md` for Option B. Both paths produce identical `.aigap/` output.

---

## All 12 prompt templates

| # | File | Use when | VS Code equivalent | Output |
|---|---|---|---|---|
| 1 | `define-policies.md` | You have a policy doc and need `.aigap/POLICIES.md` | `aigap.init` | `.aigap/POLICIES.md` |
| 2 | `update-policy.md` | A new rule arrives — append with next stable ID | `aigap.update` | `.aigap/POLICIES.md` (patch) |
| 3 | `validate-policies.md` | Check for duplicate IDs, missing fields, orphans | `aigap.validate` | Review only |
| 4 | `gap-analysis.md` | Check a code file for unenforced GP-NNN policies | `aigap.gapReport` | `.aigap/gap-report.md` |
| 5 | `generate-enforcement.md` | Generate enforcement stubs from policies | `aigap.enforcement` | `.aigap/enforcement/` |
| 6 | `audit-report.md` | Map policy IDs to audit log entries | `aigap.auditReport` | `.aigap/audit-report.md` |
| 7 | `change-impact.md` | Old policy doc vs new — what changed, what breaks | `aigap.changeImpact` | `.aigap/change-impact-report.md` |
| 8 | `framework-map.md` | Tag policies against EU AI Act / NIST / ISO 42001 | `aigap.frameworkMap` | `.aigap/framework-map.md` |
| 9 | `pr-description.md` | Traceable PR body from git diff + POLICIES.md | `aigap.prDraft` | Paste into PR |
| 10 | `release-notes.md` | Policy-mapped release notes | `aigap.releaseNotes` | `.aigap/releases/vN.md` |
| 11 | `po-status-report.md` | Plain-English compliance status for leadership | `aigap.statusReport` | `.aigap/releases/status-vN.md` |
| 12 | `sprint-feed.md` | Break policies into enforcement tasks with story points | `aigap.sprintFeed` | `.aigap/sprint-feed.md` |

---

## Recommended order for a new project

```
1. define-policies.md     → bootstraps .aigap/POLICIES.md
2. validate-policies.md   → confirms IDs are clean
3. gap-analysis.md        → finds what isn't enforced yet
4. generate-enforcement.md → generates the stubs
5. sprint-feed.md         → converts gaps into sprint tasks
6. pr-description.md      → traces every PR back to policies
7. audit-report.md        → after first production run
8. framework-map.md       → before first compliance review
9. po-status-report.md    → sprint demo / leadership update
```

Use `update-policy.md` any time a new rule arrives.
Use `change-impact.md` any time the policy document is revised.
Use `release-notes.md` at every release tag.

---

## Output files mapping

```
.aigap/
├── POLICIES.md                 ← define-policies.md (bootstrap)
│                                  update-policy.md (patch)
├── index.md                    ← validate-policies.md
├── gap-report.md               ← gap-analysis.md
├── enforcement/                ← generate-enforcement.md
├── audit-report.md             ← audit-report.md
├── change-impact-report.md     ← change-impact.md
├── framework-map.md            ← framework-map.md
├── sprint-feed.md              ← sprint-feed.md
└── releases/
    ├── vN.md                   ← release-notes.md
    └── status-vN.md            ← po-status-report.md
```

All 12 prompts reference `.aigap/registry.json` for ID assignment. If the file does not exist,
the prompt instructs you to create it with all counters starting at 0.

---

## How to use any prompt

1. Open the `.md` file
2. Read the **Use when** and **How to use** header
3. Copy everything after the `---` divider
4. Paste into your LLM (Claude, GPT-4, Gemini — any works)
5. Replace every `[PLACEHOLDER]` with the real content
6. Copy the LLM output and commit it to the path shown in the prompt

---

## Graduation path

| Stage | What you have | What to do next |
|---|---|---|
| Week 1 | `.aigap/POLICIES.md` via `define-policies.md` | Run `gap-analysis.md`, commit gap report |
| Week 2 | Gap report + enforcement stubs | Run `sprint-feed.md`, add TASK-NNN to backlog |
| Month 1 | First PR with policy IDs | Run `pr-description.md` on every PR |
| Month 2 | Team using prompts regularly | Install VS Code extension (Option B) for inline tooling |
| Month 3 | Extension in daily workflow | Enable `aigap.strictMode` + CI/CD gate |

You can stay on Option A indefinitely. Option B adds automation — not new capability.
