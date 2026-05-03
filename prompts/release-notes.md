# release-notes.md

**Use when:** You are preparing a release and need policy-mapped release notes that trace
shipped changes back to guardrail policy IDs.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md and git log
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the output to `.aigap/releases/v[VERSION].md`

**VS Code equivalent:** `aigap: Generate Release Notes` (`aigap.releaseNotes`)

---

## Prompt

You are a technical writer. Generate release notes that map code changes to guardrail policy IDs.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE — or the relevant sections]
```

### Git log / diff

```
[PASTE YOUR GIT LOG AND DIFF FOR THIS RELEASE.
 Run: git log v[PREVIOUS]..HEAD --oneline
 And: git diff v[PREVIOUS]..HEAD --stat]
```

### Release version

```
[VERSION NUMBER — e.g. v1.2.0]
```

---

### Output format

```markdown
# Release Notes — [VERSION]
_Generated: [DATE]_

## Summary

[2-3 sentence overview of what this release delivers from a governance perspective]

## What Changed

### Enforcement Added
| Policy | Change | Enforcement Type |
|---|---|---|
| GP-[NNN] | [what was implemented] | [pre-call hook / output filter / middleware / test] |

### Enforcement Modified
| Policy | Change | Reason |
|---|---|---|
| GP-[NNN] | [what changed] | [why — e.g. policy description updated] |

### Policies Still at Gap
| Policy | Severity | Planned For |
|---|---|---|
| GP-[NNN] | [severity] | [next release / backlog / deferred] |

## Known Gaps

[List any policies that remain unenforced and the plan to address them]

## Metrics

| Metric | Previous | Current |
|---|---|---|
| Policies enforced | [N] / [Total] | [N] / [Total] |
| Coverage % | [X%] | [Y%] |
| Open violations | [N] | [N] |
```

---

## After generating

1. Commit to `.aigap/releases/v[VERSION].md`
2. Reference in your GitHub Release description
3. Share with governance team for sign-off
