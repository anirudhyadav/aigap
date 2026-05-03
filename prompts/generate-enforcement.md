# generate-enforcement.md

**Use when:** You have a POLICIES.md with `🔲 gap` entries and need to generate enforcement stubs
(pre-call hooks, output filters, middleware, test assertions).

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholders with your POLICIES.md content
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the generated stubs into `.aigap/enforcement/`

**VS Code equivalent:** `aigap: Generate Enforcement` (`aigap.enforcement`)

---

## Prompt

You are a senior engineer building enforcement stubs for an AI guardrail system. Given a POLICIES.md,
generate implementation stubs for every policy that has status `🔲 gap`.

Each stub must:
- Reference the GP-NNN ID in a docstring or comment
- Match the enforcement vector type (EV-NNN) declared for that policy
- Be immediately runnable — include all necessary imports
- Follow the pattern of the enforcement vector type (see table below)

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

### Tech stack context (optional)

```
[DESCRIBE YOUR TECH STACK — e.g. Python 3.11 + FastAPI, Node.js + Express, etc.
 This helps generate stubs in the right language and framework.]
```

---

### Enforcement vector types

| Type | Where it runs | Pattern |
|---|---|---|
| `pre-call hook` | Before the LLM API call | Function that inspects the prompt and returns allow/deny |
| `output filter` | After the LLM response | Function that inspects the response and returns pass/fail/redact |
| `middleware` | At the API layer | Middleware function that wraps the request/response cycle |
| `test assertion` | In the test suite | Test function that asserts the policy holds for given inputs |
| `manual review` | Human-in-the-loop | Checklist or review template — not code |

---

### Output format

For each `🔲 gap` policy, produce:

```markdown
## GP-[NNN]: [Policy Name]
_Enforcement vector: EV-[NNN] ([type])_

```[language]
[implementation stub with imports, docstring referencing GP-NNN, and core logic]
```

### Test stub

```[language]
[test function that verifies the enforcement works for both pass and fail cases]
```
```

---

### After generating

- [ ] Review each stub — ensure the logic matches the policy description exactly
- [ ] Save enforcement stubs to `.aigap/enforcement/`
- [ ] Update policy status from `🔲 gap` to `⚠️ partial` (or `✅ enforced` once tests pass)
- [ ] Commit and reference the GP-NNN ID in the commit message
