# po-status-report.md

**Use when:** You need a plain-English compliance status report for leadership, the product owner,
or the governance steering committee.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md and recent check results
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the output to `.aigap/releases/status-v[VERSION].md`

**VS Code equivalent:** `aigap: Generate Status Report` (`aigap.statusReport`)

---

## Prompt

You are writing a compliance status report for non-technical leadership. Use plain English.
No code, no jargon. Explain everything in terms of risk, progress, and next steps.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

### Recent check results (optional)

```
[PASTE THE LATEST aigap CHECK OUTPUT — Markdown report or JSON summary.
 If not available, the report will be based on POLICIES.md status fields only.]
```

### Version / sprint

```
[CURRENT VERSION OR SPRINT — e.g. "v1.2 / Sprint 14"]
```

---

### Output format

```markdown
# Compliance Status Report — [VERSION / SPRINT]
_Prepared for: Leadership · Date: [DATE]_

## Executive Summary

[3-4 sentences: overall compliance posture, key wins, key risks]

## Scorecard

| Category | Status | Trend |
|---|---|---|
| Data Privacy | ✅ On track / ⚠️ At risk / ❌ Off track | ↑ Improving / → Stable / ↓ Declining |
| Safety & Harm | [status] | [trend] |
| Business Rules | [status] | [trend] |
| Operational | [status] | [trend] |

## What's Working

- [policy or category that is fully enforced and passing]
- [enforcement that was added this sprint]

## What Needs Attention

- [policy or category at risk — explain in plain English]
- [enforcement gap that affects compliance posture]

## Key Metrics

| Metric | Value | Target |
|---|---|---|
| Policies fully enforced | [N] / [Total] ([%]) | 100% |
| Critical/High gaps remaining | [N] | 0 |
| Drift from baseline | [+/- pp] | < 5 pp |

## Next Steps

1. [Highest priority action — who, what, when]
2. [Second priority action]
3. [Third priority action]

## Sign-off

| Role | Name | Date |
|---|---|---|
| Product Owner | | |
| Governance Lead | | |
```

---

## After generating

- [ ] Review with governance lead for accuracy
- [ ] Present at sprint demo or steering committee
- [ ] Commit to `.aigap/releases/status-v[VERSION].md`
- [ ] Create tickets for items in "What Needs Attention"
