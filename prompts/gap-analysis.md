# gap-analysis.md

**Use when:** You want to check whether a specific code file (or set of files) actually enforces
the policies in POLICIES.md.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md and source code
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Review the output to find unenforced policies

**VS Code equivalent:** `aigap: Show Gap Report` (`aigap.gapReport`)

---

## Prompt

You are a governance auditor performing a policy enforcement traceability audit. Given a POLICIES.md
guardrail specification and one or more source code files, identify which policies are enforced,
partially enforced, or missing entirely.

Be precise — a policy is only "enforced" if the code contains logic that implements or checks for it.
A function that exists but has no logic for a guardrail rule does not count as enforcement.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE — or the relevant sections (Categories, Policies, Vectors)]
```

### Source Code File(s)

```
[PASTE THE SOURCE FILE(S) YOU WANT TO CHECK — include the filename at the top of each block]
```

---

### Output format

## Coverage Summary

| ID | Type | Policy | Status | Notes |
|---|---|---|---|---|
| GP-001 | Guardrail Policy | [policy name] | ✅ Enforced / ⚠️ Partial / ❌ Missing | [what's present or absent] |

---

## Coverage Score

```
Guardrail Policies:    X / Y enforced  (Z%)
Enforcement Vectors:   X / Y used      (Z%)
Overall:               X / Y enforced  (Z%)
```

---

## Missing Policies (Action Required)

| ID | Policy | What Needs to Be Built |
|---|---|---|
| GP-003 | [policy name] | [specific hook, filter, or check missing] |

---

## Partial Enforcement (Review Needed)

| ID | Policy | What's Present | What's Missing |
|---|---|---|---|
| GP-002 | [policy name] | [what exists] | [what's still needed] |

---

## Recommendations

1. [Highest priority gap — explain why it's critical]
2. [Second priority gap]
3. [Any structural issues — e.g. guardrail enforced in UI but not API layer]

---

## After running

1. For each ❌ Missing item — create a ticket referencing the policy ID (e.g. "Implement GP-003: No PII Leakage enforcement")
2. For each ⚠️ Partial item — review with the lead engineer whether the gap is intentional or missed
3. Commit a `gap-report-YYYY-MM-DD.md` to `.aigap/` for audit trail
