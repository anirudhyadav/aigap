# validate-policies.md

**Use when:** You want to check `.aigap/POLICIES.md` for structural problems before relying on it
for enforcement, audit, or CI/CD gating.

**How to use:**
1. Copy everything below the `---` divider
2. Replace the placeholder with your POLICIES.md content
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Fix any issues found before committing

**VS Code equivalent:** `aigap: Validate Policies` (`aigap.validate`)

---

## Prompt

You are a governance auditor. Review the POLICIES.md below and produce a validation report.

Check for every issue in the checklist, in order. Be precise — quote the exact ID or line that has the problem.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

---

### Validation checklist

1. **Duplicate IDs** — Are any GP-NNN, GC-NNN, or EV-NNN IDs used more than once?
2. **ID gaps** — Are there missing numbers in the sequence (e.g. GP-001, GP-003 with no GP-002)?
3. **Missing required fields** — Does every GP have: name, description, severity, vector, status?
4. **Invalid severity** — Is every severity one of: `critical`, `high`, `medium`, `low`?
5. **Invalid status** — Is every status one of: `🔲 gap`, `✅ enforced`, `⚠️ partial`, `[DEPRECATED]`?
6. **Orphan vectors** — Are there EV-NNN entries not referenced by any GP?
7. **Missing vectors** — Are there GP entries referencing an EV-NNN that does not exist?
8. **Vague descriptions** — Flag any description using words like "appropriate", "reasonable", "good", "bad", "fast", "soon" without quantification
9. **Empty categories** — Are there GC categories with zero GP entries?
10. **Cross-reference integrity** — Does every GP reference a valid EV?

---

### Output format

```markdown
## Validation Report

**Status:** PASS / FAIL (N errors, M warnings)

### Errors (must fix)

| # | Type | ID / Line | Issue | Fix |
|---|---|---|---|---|
| 1 | [type] | [ID] | [what's wrong] | [how to fix] |

### Warnings (should fix)

| # | Type | ID / Line | Issue | Suggestion |
|---|---|---|---|---|
| 1 | [type] | [ID] | [what's wrong] | [suggested improvement] |

### Summary

- Total policies: [N]
- Total categories: [N]
- Total enforcement vectors: [N]
- Policies with enforcement: [N] / [Total] ([%])
- Policies deprecated: [N]
```

---

## After running

1. Fix all **Errors** before committing — they break traceability
2. Address **Warnings** before the next sprint starts
3. Run this validation again after every batch update to POLICIES.md
