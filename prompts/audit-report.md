# audit-report.md

**Use when:** You need to map policy IDs (GP-NNN) to actual audit log entries, enforcement events,
or incident reports to produce an auditable compliance record.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md and audit log data
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the output to `.aigap/audit-report.md`

**VS Code equivalent:** `aigap: Generate Audit Report` (`aigap.auditReport`)

---

## Prompt

You are a compliance auditor. Given a POLICIES.md guardrail specification and audit log data,
produce an audit report that maps each policy to its enforcement evidence.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

### Audit log data

```
[PASTE YOUR AUDIT LOG DATA HERE.
 This can be: application logs, monitoring alerts, incident reports, test run results,
 or aigap check output (JSON or Markdown report).]
```

### Time period

```
[SPECIFY THE AUDIT PERIOD — e.g. "2026-Q1" or "2026-04-01 to 2026-04-30"]
```

---

### Output format

```markdown
# Audit Report — [PROJECT NAME]
_Period: [TIME PERIOD] · Generated: [DATE]_

## Executive Summary

| Metric | Value |
|---|---|
| Total policies | [N] |
| Policies with enforcement evidence | [N] ([%]) |
| Policies without evidence | [N] ([%]) |
| Critical/High violations detected | [N] |
| Incidents requiring remediation | [N] |

---

## Policy Audit Detail

### GP-001: [Policy Name]
- **Severity:** [severity]
- **Enforcement status:** ✅ enforced / ⚠️ partial / 🔲 gap
- **Evidence:** [specific log entries, test results, or monitoring data]
- **Violations detected:** [count and summary]
- **Remediation status:** [N/A / in progress / completed]

### GP-002: [Policy Name]
[...repeat for each policy...]

---

## Violations Summary

| # | Policy | Date | Description | Severity | Remediation |
|---|---|---|---|---|---|
| 1 | GP-[NNN] | [date] | [what happened] | [severity] | [action taken] |

---

## Recommendations

1. [Highest priority action]
2. [Second priority action]
3. [Systemic improvement]

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Governance Lead | | | |
| Engineering Lead | | | |
```

---

## After generating

- [ ] Review audit evidence for accuracy
- [ ] Commit to `.aigap/audit-report.md`
- [ ] Share with compliance / governance team for sign-off
- [ ] Create tickets for any unresolved violations
