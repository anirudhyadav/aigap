# change-impact.md

**Use when:** A revised policy document arrives and you need to understand what changed,
what was added, and what was removed before updating POLICIES.md.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with current POLICIES.md and the new policy document
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Review the impact report with the governance team before updating

**VS Code equivalent:** `aigap: Analyse Change Impact` (`aigap.changeImpact`)

---

## Prompt

You are a governance engineer performing a change impact analysis. Compare the current POLICIES.md
against the new policy document and produce a detailed impact report.

Be thorough — flag every difference, no matter how small. Policy changes can have cascading effects
on enforcement, audit trails, and compliance posture.

### Current POLICIES.md

```markdown
[PASTE YOUR CURRENT .aigap/POLICIES.md HERE]
```

### New policy document

```
[PASTE THE NEW POLICY DOCUMENT HERE — PDF text, Word extract, Confluence page, or prose]
```

---

### Output format

```markdown
# Change Impact Report
_Current: v[CURRENT] → Proposed: v[NEW] · Generated: [DATE]_

## Summary

| Change type | Count |
|---|---|
| New rules | [N] |
| Modified rules | [N] |
| Removed rules | [N] |
| Severity changes | [N] |
| Breaking changes | [N] |

---

## New Rules (not yet in POLICIES.md)

| # | Proposed ID | Name | Description | Severity | Impact |
|---|---|---|---|---|---|
| 1 | GP-[NEXT] | [name] | [description] | [severity] | [what this adds to governance] |

---

## Modified Rules (scope or wording changed)

| # | ID | Field | Old Value | New Value | Breaking? |
|---|---|---|---|---|---|
| 1 | GP-[NNN] | description | [old] | [new] | Yes / No |

---

## Removed Rules (present in current, absent from new)

| # | ID | Name | Impact | Recommendation |
|---|---|---|---|---|
| 1 | GP-[NNN] | [name] | [what enforcement is affected] | Mark [DEPRECATED] / Escalate |

---

## Breaking Changes

List every change that would invalidate existing enforcement stubs, test assertions, or CI gates:

| # | Change | Affected Enforcement | Action Required |
|---|---|---|---|
| 1 | [description] | [EV-NNN / test file / CI step] | [what needs updating] |

---

## Recommendations

1. [Highest priority action before updating]
2. [Second priority action]
3. [Risk if change is not reviewed with governance team]
```

---

## After running

1. Review with governance team — do NOT auto-apply changes
2. For each new rule: run `update-policy.md` to add it with a new GP-NNN ID
3. For each modified rule: update the description in POLICIES.md and bump the version
4. For each removed rule: mark as `[DEPRECATED]` — never delete the ID
5. Commit `.aigap/change-impact-report.md` for audit trail
