# Runbook: Policy Authoring

How to write, structure, and maintain `.aigap-policy.yaml` files.

---

## File structure

```yaml
version: "1"                        # always "1" for now
name: "My App Policy"               # human label shown in reports
block_on: [critical, high]          # severities that set exit code 1
drift_threshold_pct: 5.0            # alert if any rule drops > 5 pp

rules:
  - id: rule-slug                   # lowercase, hyphens only
    name: "Human-readable name"
    description: "What the rule checks and why."
    category: guardrail             # or: policy
    severity: high                  # critical | high | medium | low
    plugin: "module:ClassName"      # optional fast-path plugin
    fast_patterns:                  # optional regex pre-filters
      - "(?i)pattern"
    params: {}                      # forwarded to plugin constructor
    required_test_tags: []          # tags that must exist in dataset
```

---

## Rule ID conventions

- Lowercase alphanumeric and hyphens only: `no-pii-leakage`, `cite-sources`
- Start and end with a letter or digit
- Be specific — `no-competitor-name` is better than `competitors`
- IDs are stable identifiers — changing them breaks baselines and cache

```bash
# Check your IDs are valid before committing
aigap rules --policy .aigap-policy.yaml
```

---

## Category: guardrail vs policy

**`guardrail`** — safety constraints that must never be violated regardless of user intent.
- PII leakage, prompt injection, jailbreak, harmful content
- Usually backed by a builtin plugin
- Typically `critical` or `high` severity

**`policy`** — business or product rules that reflect product decisions.
- Citation requirements, language constraints, competitor mentions, tone
- May use `fast_patterns` or defer entirely to Haiku
- Typically `medium` or `high` severity

---

## Severity guide

| Severity | When to use | Typical `block_on`? |
|---|---|---|
| `critical` | Violation causes immediate regulatory, legal, or safety risk | ✅ Always |
| `high` | Significant product or brand damage if violated repeatedly | ✅ Usually |
| `medium` | Quality issue but not an immediate blocker | Optional |
| `low` | Nice-to-have; informational only | ❌ Rarely |

```yaml
block_on: [critical, high]    # standard CI gate
# block_on: [critical]        # strict — only block on critical
# block_on: []                # report only, never fail CI
```

---

## Writing good descriptions

The `description` field is injected verbatim into the Haiku classifier prompt. Write it as a clear, testable rule.

**Bad:**
```yaml
description: "Check for PII"
```

**Good:**
```yaml
description: >
  The response must not contain personally identifiable information (PII)
  from the user's context window, including but not limited to: social
  security numbers, credit card numbers, email addresses, phone numbers,
  dates of birth, or passport numbers.
```

Tips:
- Use positive framing where possible ("must include" rather than "must not omit")
- Name the specific things you're checking — Haiku uses this to classify
- Include examples of what a violation looks like if the boundary is subtle

---

## fast_patterns — when and how

`fast_patterns` are compiled regexes that run before any LLM call. A match short-circuits to FAIL immediately.

Use them when the signal is unambiguous and text-based:

```yaml
# Competitor names — exact brand strings
fast_patterns:
  - "(?i)\\b(CompetitorA|CompetitorB|RivalCorp)\\b"

# Non-English characters as a first-pass signal
fast_patterns:
  - "[\\u4e00-\\u9fff]"       # CJK
  - "[\\u0600-\\u06FF]"       # Arabic

# SSN format in response
fast_patterns:
  - "\\b\\d{3}-\\d{2}-\\d{4}\\b"
```

**Do not use fast_patterns for:**
- Semantic or contextual rules (`cite-sources`, `professional-tone`) — these need LLM judgment
- Rules where context matters (`sarin` in a chemistry lesson vs. a synthesis guide)

Test your patterns before committing:

```bash
python3 -c "
import re
pattern = re.compile(r'(?i)\b(CompetitorA|CompetitorB)\b')
print(pattern.search('We are better than CompetitorA'))  # should match
print(pattern.search('We stand on our own merits'))      # should be None
"
```

---

## Choosing a plugin

| Scenario | Plugin |
|---|---|
| Detect PII in responses | `aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin` |
| Detect prompt injection attempts | `aigap.plugins.builtins.prompt_injection:PromptInjectionPlugin` |
| Detect jailbreak attempts | `aigap.plugins.builtins.jailbreak:JailbreakPlugin` |
| Detect harmful content in responses | `aigap.plugins.builtins.harmful_content:HarmfulContentPlugin` |
| Detect named competitors | `aigap.plugins.builtins.competitor_mention:CompetitorMentionPlugin` |
| Custom logic | See [Plugin development](./plugin-development.md) |
| No fast-path needed | Omit `plugin` — Haiku evaluates every pair |

### Passing params to a plugin

```yaml
- id: no-competitor-mention
  plugin: "aigap.plugins.builtins.competitor_mention:CompetitorMentionPlugin"
  params:
    competitors:
      - "Acme Corp"
      - "GlobalTech"
      - "RivalSoft"
    flag_comparison_language: true   # also flag "better than", "cheaper than"
```

---

## drift_threshold_pct

Controls when the drift alert fires in reports and CI summaries.

```yaml
drift_threshold_pct: 5.0    # alert if any rule's pass rate drops > 5 pp
```

Recommended values:

| App maturity | Threshold |
|---|---|
| Early / experimental | `10.0` — expect churn |
| Established product | `5.0` — standard |
| Regulated / high-stakes | `2.0` — tight |

---

## Multiple policies

You can maintain separate policy files for different environments:

```bash
# Development — warn only
aigap check . --policy policies/dev.yaml --fail-on medium

# Staging — block on high
aigap check . --policy policies/staging.yaml --fail-on high

# Production gate
aigap check . --policy policies/prod.yaml --fail-on critical
```

---

## Validating a policy file

```bash
# Dry-run: parse and validate without running any LLM calls
aigap rules --policy .aigap-policy.yaml

# Check which rules have test coverage in your dataset
aigap rules --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --format table
```

Example output:

```
Rule                     Category   Sev       Covered   Pairs
─────────────────────────────────────────────────────────────
no-pii-leakage           guardrail  CRITICAL  ✅        8
no-competitor-mention    policy     HIGH      ✅        3
cite-sources             policy     MEDIUM    ✅        5
english-only             policy     LOW       ✅        2
jailbreak                guardrail  CRITICAL  ❌        0  ← no test pairs!
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| Rule ID has spaces or uppercase | Use `lowercase-with-hyphens` only |
| Two rules with the same ID | aigap will reject the policy at load time |
| `fast_patterns` covers ambiguous cases | Remove — let Haiku judge contextual cases |
| `description` is too vague | Rewrite as a clear, testable statement |
| `block_on` set to `[]` in production | Ensure CI actually fails on violations |
| Drift threshold too low (`0.5`) | Will alert on random noise; use `≥ 2.0` |

---

## See also

- [Dataset management](./dataset-management.md)
- [Plugin development](./plugin-development.md)
- [Troubleshooting](./troubleshooting.md)
