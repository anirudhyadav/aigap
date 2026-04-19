# Runbook: Baseline & Drift Management

How to establish baselines, track drift, and respond to regressions.

---

## What is drift?

Drift measures how your LLM app's guardrail pass rates change between runs.
A rule that was passing 95% of pairs last week but only 85% this week has
drifted by −10 percentage points.

Causes of drift:
- Model upgrade or prompt change in your app
- New adversarial inputs reaching production
- Policy tightening (new rules added)
- Dataset expansion (new pairs exercising previously untested scenarios)

---

## Baseline file format

`aigap-baseline.json` — committed to your repo:

```json
{
  "run_id": "a1b2c3d4e5f6",
  "timestamp": "2026-04-19T14:32:00Z",
  "rules": {
    "no-pii-leakage": {
      "pass_rate": 1.0,
      "total_pairs": 50
    },
    "cite-sources": {
      "pass_rate": 0.92,
      "total_pairs": 50
    }
  }
}
```

---

## Workflow

### First run — establish baseline

```bash
# Run check once to get initial results
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl

# Save the results as baseline
aigap baseline save
# → Saved to: aigap-baseline.json

# Commit baseline to repo
git add aigap-baseline.json
git commit -m "chore: add aigap baseline"
```

### Subsequent runs — compare against baseline

```bash
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json
```

Drift report output:

```
Drift report  (baseline: a1b2c3)
─────────────────────────────────────────────────
  no-pii-leakage          100% → 100%   ── stable
  prompt-injection         96% →  94%   ↓ −2.0%
  no-competitor-mention    94% →  96%   ↑ +2.0%
  cite-sources             92% →  72%   ↓ −20.0% ⚠️ ALERT
  english-only             98% →  98%   ── stable

Overall drift: −4.0%
⚠️  cite-sources degraded by 20.0 pp (threshold: 5.0 pp)
```

### After a planned model/prompt upgrade — update baseline

```bash
# Run the check first
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json

# If results are acceptable, promote to new baseline
aigap baseline save
git add aigap-baseline.json
git commit -m "chore: update aigap baseline after gpt-4o upgrade"
```

---

## `aigap baseline` commands

```bash
# Save current run as baseline (reads latest report from disk)
aigap baseline save

# Save to a specific path
aigap baseline save --output baselines/prod-2026-04-19.json

# Show what's in the current baseline
aigap baseline show

# Show baseline at a specific path
aigap baseline show --input baselines/prod-2026-04-19.json

# Diff two baseline files
aigap baseline diff \
  baselines/prod-2026-04-01.json \
  baselines/prod-2026-04-19.json
```

---

## Configuring the drift threshold

```yaml
# .aigap-policy.yaml
drift_threshold_pct: 5.0    # alert if any rule drops > 5 pp
```

Or per-run:

```bash
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json \
  --drift-threshold 3.0
```

| Threshold | Good for |
|---|---|
| `10.0` | Early-stage apps, frequent iteration |
| `5.0` | Standard production apps |
| `2.0` | Regulated or high-stakes apps |
| `0.5` | Very stable apps with large datasets (low noise) |

Too low a threshold generates alert noise from statistical variance, especially
with small datasets (< 20 pairs per rule).  Use `≥ 2.0` for datasets under 50 pairs.

---

## Responding to a drift alert

### 1. Identify the failing rule

```bash
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json \
  --output report.json

python3 -c "
import json
r = json.load(open('report.json'))
for entry in r.get('drift', {}).get('entries', []):
    if entry['direction'] == 'degraded':
        print(f\"{entry['rule_id']}: {entry['delta_pct']:+.1f}%\")
"
```

### 2. Inspect failures in the dashboard

```bash
aigap serve
# Open http://localhost:7823 → click degraded rule → read failure cards
```

### 3. Root cause categories

| Symptom | Likely cause |
|---|---|
| Sudden large drop (> 15 pp) on one rule | Prompt change in your LLM app |
| Gradual drift (−2 to −5 pp/week) | Model behaviour shift (update) |
| All rules drift together | Dataset expansion with harder pairs |
| Only guardrail rules drift | New adversarial inputs reaching prod |
| Only policy rules drift | Policy description is ambiguous for Haiku |

### 4. Remediation actions

```bash
# Fix the system prompt in your app, then re-run
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl

# Add regression pairs for the failing scenarios
echo '{"id": "regression-001", "prompt": "...", "response": "...", "expected_pass": {"cite-sources": false}}' \
  >> tests/golden_dataset.jsonl

# Tighten the rule description if Haiku is making wrong calls
# (edit .aigap-policy.yaml, then re-run)

# After fix is confirmed, update baseline
aigap baseline save
```

---

## Branching strategy for baselines

Maintain separate baselines per long-lived branch:

```bash
# main branch
aigap-baseline.json

# release/v2 branch
aigap-baseline-v2.json

# Check against branch-specific baseline in CI
aigap check . \
  --baseline aigap-baseline-${BRANCH_NAME:-main}.json \
  ...
```

---

## Baseline history

For audit / compliance purposes, archive baselines before overwriting:

```bash
# Archive current baseline before saving new one
DATE=$(date +%Y-%m-%d)
cp aigap-baseline.json "baselines/aigap-baseline-${DATE}.json"
aigap baseline save
git add aigap-baseline.json "baselines/aigap-baseline-${DATE}.json"
git commit -m "chore: update aigap baseline (archived ${DATE})"
```

---

## See also

- [CI integration](./ci-integration.md)
- [Troubleshooting](./troubleshooting.md)
