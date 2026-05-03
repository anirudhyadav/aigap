# pr-description.md

**Use when:** You are opening a pull request and want a traceable PR description that maps
code changes back to guardrail policy IDs.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md and git diff
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Paste the output directly into your PR description

**VS Code equivalent:** `aigap: Draft Pull Request Description` (`aigap.prDraft`)

---

## Prompt

You are a senior engineer writing a pull request description. Given the guardrail policies context
and git changes, generate a professional PR description that traces changes back to policy IDs.

### POLICIES.md (relevant sections)

```markdown
[PASTE THE RELEVANT SECTIONS OF .aigap/POLICIES.md HERE]
```

### Git diff / commit messages

```
[PASTE YOUR GIT DIFF OR COMMIT MESSAGES HERE.
 Run: git diff main..HEAD --stat
 And: git log main..HEAD --oneline]
```

---

### Output format

```markdown
## What Changed

- [bullet list of changes, reference policy IDs like GP-001 wherever applicable]

## Policies Covered

| ID | Policy | Status |
|---|---|---|
| GP-001 | [policy name] | ✅ Enforced / ⚠️ Partial / 🔲 Not addressed |

## Enforcement Coverage

- [which enforcement stubs are added or modified]
- [which test files cover the changes]

## Notes

- [anything the reviewer should know — trade-offs, edge cases, deferred items]
```

---

## After generating

1. Paste into your PR description
2. Ensure every GP-NNN reference is accurate — reviewers will use them for traceability
3. If any policy is listed as `🔲 Not addressed`, explain why in the Notes section
