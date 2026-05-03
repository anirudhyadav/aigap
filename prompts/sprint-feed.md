# sprint-feed.md

**Use when:** You need to break POLICIES.md into actionable sprint tasks with story points,
acceptance criteria, and enforcement targets.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholder with your POLICIES.md content
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the output to `.aigap/sprint-feed.md`

**VS Code equivalent:** `aigap: Generate Sprint Feed` (`aigap.sprintFeed`)

---

## Prompt

You are a scrum master planning enforcement work. Given a POLICIES.md, generate sprint-ready
task cards for every policy that has status `🔲 gap` or `⚠️ partial`.

Each task must be implementable in a single sprint (≤ 8 story points). If a policy requires
more work, split it into multiple tasks.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

### Team context (optional)

```
[TEAM SIZE, TECH STACK, SPRINT LENGTH — e.g. "4 engineers, Python + FastAPI, 2-week sprints"]
```

---

### Output format

```markdown
# Sprint Feed — [PROJECT NAME]
_Generated: [DATE] · Source: .aigap/POLICIES.md v[VERSION]_

## Summary

| Priority | Tasks | Story Points |
|---|---|---|
| Critical | [N] | [SP] |
| High | [N] | [SP] |
| Medium | [N] | [SP] |
| Low | [N] | [SP] |
| **Total** | **[N]** | **[SP]** |

---

## TASK-001: Enforce GP-001 — [Policy Name]
_Priority: [critical/high/medium/low] · Story points: [N] · Vector: EV-[NNN]_

**Traces:** GP-001

**Description:**
[What needs to be built — specific enough for a developer to start immediately]

**Acceptance Criteria:**
- [ ] [Given/When/Then or specific check]
- [ ] [Second criterion]
- [ ] Policy status updated to `✅ enforced` in POLICIES.md

**Definition of Done:**
- [ ] Enforcement stub committed to `.aigap/enforcement/`
- [ ] Unit test written and passing
- [ ] `aigap check` passes for this rule (if using Python CLI)
- [ ] PR references GP-001

---

## TASK-002: Enforce GP-002 — [Policy Name]
[...repeat for each gap/partial policy...]
```

---

### Story point guide

| Points | Complexity |
|---|---|
| 1 | Add a regex fast_pattern — no LLM logic needed |
| 2 | Simple pre-call hook or output filter |
| 3 | Hook with edge cases or configuration |
| 5 | Middleware integration with existing API layer |
| 8 | Complex multi-stage enforcement with test suite |

---

## After generating

- [ ] Review story point estimates with the team
- [ ] Import TASK-NNN items into your project tracker (Jira, Linear, GitHub Issues)
- [ ] Commit `.aigap/sprint-feed.md` for audit trail
- [ ] Reference TASK-NNN and GP-NNN IDs in all related PRs
