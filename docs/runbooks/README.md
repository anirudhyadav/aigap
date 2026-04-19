# aigap Runbooks

Operational documentation for installing, configuring, running, and maintaining aigap.

---

## Runbooks

| Runbook | When to use |
|---|---|
| [Getting started](./getting-started.md) | First install, first policy, first check |
| [Policy authoring](./policy-authoring.md) | Writing and maintaining `.aigap-policy.yaml` |
| [Dataset management](./dataset-management.md) | Building and labelling golden datasets |
| [CI integration](./ci-integration.md) | GitHub Actions, GitLab CI, merge gates |
| [Baseline & drift](./baseline-drift.md) | Tracking and responding to pass-rate drift |
| [Plugin development](./plugin-development.md) | Writing custom `PolicyPlugin` subclasses |
| [LLM chain internals](./llm-chain.md) | Haiku → Sonnet → Opus pipeline, caching, tuning |
| [Dashboard](./dashboard.md) | Using the `aigap serve` web dashboard |
| [Troubleshooting](./troubleshooting.md) | Common errors and fixes |

---

## Quick-reference commands

```bash
# First run
pip install aigap
export ANTHROPIC_API_KEY=sk-ant-...
aigap init --template customer-support
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl

# Save baseline
aigap baseline save

# CI check with drift gate
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --baseline aigap-baseline.json \
  --fail-on high --ci

# List rules
aigap rules --policy .aigap-policy.yaml

# Open dashboard
aigap serve
```

---

## Need help?

- Open an issue: https://github.com/anirudhyadav/aigap/issues
- See [Troubleshooting](./troubleshooting.md) for common errors
