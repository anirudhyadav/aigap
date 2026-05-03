# update-policy.md

**Use when:** A new guardrail rule or constraint arrives from the governance team and needs to be
added to an existing `.aigap/POLICIES.md`.

**How to use:**
1. Copy everything below the `---` divider
2. Replace every `[PLACEHOLDER]` with the real content
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Patch the output into `.aigap/POLICIES.md`
5. Update `.aigap/registry.json` counters

**VS Code equivalent:** `aigap: Update Policy` (`aigap.update`)

---

## Prompt

You are an AI governance engineer working with Anirudh Yadav.

A new rule has been received from the governance team. Your job is to:

1. Read the new rule text below
2. Read the current POLICIES.md and registry.json
3. Determine the appropriate Guardrail Category (existing or new GC)
4. Assign the next available GP-NNN ID
5. Assign or reference the appropriate EV-NNN enforcement vector
6. Produce a patch to append to POLICIES.md
7. Produce an updated registry.json

---

### New rule (from governance team)

```
[PASTE THE NEW RULE TEXT HERE.
 Include: what it constrains, severity, and how it should be enforced if known.]
```

---

### Current .aigap/POLICIES.md

```markdown
[PASTE YOUR CURRENT .aigap/POLICIES.md HERE]
```

---

### Current .aigap/registry.json

```json
[PASTE YOUR CURRENT .aigap/registry.json HERE]
```

---

### Output format

**1. New row(s) to append to the appropriate category table:**

```markdown
| GP-[NEXT] | [Name ≤ 8 words] | [Description — precise, enforceable] | [severity] | EV-[NNN] | 🔲 gap |
```

**2. New enforcement vector (only if no existing EV matches):**

```markdown
| EV-[NEXT] | [type] | [description] |
```

**3. Changelog entry (append to bottom of POLICIES.md):**

```markdown
- [DATE] v[NEXT_VERSION]: GP-[NNN] added ([source])
```

**4. Updated registry.json:**

```json
{
  "GP": [UPDATED_COUNTER],
  "GC": [UPDATED_IF_NEW_CATEGORY],
  "EV": [UPDATED_IF_NEW_VECTOR],
  "FR": [UNCHANGED],
  "lastUpdated": "[DATE]"
}
```

---

### ID assignment rules

1. Read current counter → add 1 → that is the new ID → update counter
2. Never skip numbers
3. Never reuse a number — even if a policy is deprecated
4. If the rule fits an existing GC, add it there; only create a new GC if it is genuinely a new category

---

## After generating

- [ ] Review the new GP entry for accuracy and completeness
- [ ] Patch into `.aigap/POLICIES.md` under the correct category table
- [ ] Commit updated `POLICIES.md` and `registry.json`
- [ ] Reference the GP-NNN ID in your commit message
