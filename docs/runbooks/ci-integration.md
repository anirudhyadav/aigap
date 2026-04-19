# Runbook: CI Integration

Running aigap as a merge gate in GitHub Actions, GitLab CI, and other pipelines.

---

## How the CI gate works

```
PR opened
    │
    ▼
aigap check runs
    │
    ├── exit 0 → all block_on rules pass → CI check ✅
    └── exit 1 → at least one critical/high rule failed → CI check ❌
                        │
                        └── PR blocked from merging
```

The `--ci` flag also writes a Markdown scorecard to `$GITHUB_STEP_SUMMARY`,
visible in the PR checks tab without opening the logs.

---

## GitHub Actions — minimal setup

```yaml
# .github/workflows/aigap.yaml
name: aigap guardrail check

on:
  push:
    branches: [main]
  pull_request:

jobs:
  aigap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install aigap
        run: pip install aigap

      - name: Run aigap check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --fail-on high \
            --ci \
            --output aigap-report.json

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: aigap-report
          path: aigap-report.json
```

---

## GitHub Actions — with drift gate

```yaml
      - name: Run aigap check with drift gate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --baseline aigap-baseline.json \
            --fail-on high \
            --ci \
            --output aigap-report.json

      - name: Update baseline on main
        if: github.ref == 'refs/heads/main' && success()
        run: |
          aigap baseline save --output aigap-baseline.json
          git config user.email "ci@example.com"
          git config user.name "aigap CI"
          git add aigap-baseline.json
          git diff --cached --quiet || git commit -m "chore: update aigap baseline [skip ci]"
          git push
```

---

## GitHub Actions — caching API results between runs

Cache the `.aigap_cache/` directory to avoid re-calling the API for
unchanged pairs on every run:

```yaml
      - name: Restore aigap cache
        uses: actions/cache@v4
        with:
          path: .aigap_cache
          key: aigap-${{ hashFiles('.aigap-policy.yaml', 'tests/golden_dataset.jsonl') }}
          restore-keys: aigap-

      - name: Run aigap check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/golden_dataset.jsonl \
            --fail-on high \
            --ci
```

**Effect:** If neither the policy nor the dataset changed since the last run,
the entire check completes in under 5 seconds (all cache hits).

---

## GitLab CI

```yaml
# .gitlab-ci.yml
aigap:
  stage: test
  image: python:3.11
  before_script:
    - pip install aigap
  script:
    - aigap check .
        --policy .aigap-policy.yaml
        --dataset tests/golden_dataset.jsonl
        --fail-on high
        --output aigap-report.json
  artifacts:
    when: always
    paths:
      - aigap-report.json
    expire_in: 30 days
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY   # set in GitLab CI/CD variables
```

---

## Exit codes

| Code | Meaning | Action |
|---|---|---|
| `0` | All `block_on` rules pass | ✅ Proceed |
| `1` | At least one `block_on` rule failed | ❌ Block merge |
| `2` | Policy or dataset file not found | ❌ Fix file paths |
| `3` | Anthropic API error | ⚠️ Check `ANTHROPIC_API_KEY`, retry |

---

## Controlling what blocks the merge

```bash
# Only block on critical violations (permissive)
aigap check . --fail-on critical

# Block on critical + high (standard — default)
aigap check . --fail-on high

# Block on any failure including medium (strict)
aigap check . --fail-on medium

# Never block CI — report only
aigap check . --fail-on ""
```

Alternatively, set per-policy in `.aigap-policy.yaml`:

```yaml
block_on: [critical]   # policy-level default — CLI --fail-on overrides this
```

---

## PR comment integration

Post the aigap report as a PR comment using `gh`:

```yaml
      - name: Comment on PR
        if: github.event_name == 'pull_request' && always()
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          GRADE=$(python3 -c "import json; r=json.load(open('aigap-report.json')); print(r['efficacy']['grade'])")
          SCORE=$(python3 -c "import json; r=json.load(open('aigap-report.json')); print(r['efficacy']['overall_score'])")
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "## aigap guardrail check
          **Grade: ${GRADE}  Score: ${SCORE}/100**

          See the full report in the workflow artifacts."
```

---

## Multi-environment policies

Use different policies for different CI stages:

```yaml
# .github/workflows/aigap.yaml
strategy:
  matrix:
    env: [dev, staging, prod]

steps:
  - name: Run aigap check (${{ matrix.env }})
    run: |
      aigap check . \
        --policy policies/${{ matrix.env }}.yaml \
        --dataset tests/golden_dataset.jsonl \
        --fail-on ${{ matrix.env == 'prod' && 'high' || 'critical' }} \
        --ci
```

---

## Scheduled full re-evaluation

Run a weekly full check against production logs to catch model drift:

```yaml
# .github/workflows/aigap-weekly.yaml
on:
  schedule:
    - cron: '0 6 * * 1'    # Every Monday at 06:00 UTC

jobs:
  aigap-weekly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install aigap
      - name: Export recent production logs
        run: your-app export-logs --last 7d > tests/weekly_dataset.jsonl
      - name: Run weekly check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          aigap check . \
            --policy .aigap-policy.yaml \
            --dataset tests/weekly_dataset.jsonl \
            --baseline aigap-baseline.json \
            --ci \
            --output aigap-weekly-report.json
```

---

## Secrets management

| Secret | Where to set | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | GitHub → Settings → Secrets | Required for every run |
| `AIGAP_CACHE_DIR` | Environment variable | Override cache location (default: `.aigap_cache`) |

Never commit `ANTHROPIC_API_KEY` or `.env` to the repository.
Add to `.gitignore`:

```
.env
.aigap_cache/
aigap-report.json
```

---

## See also

- [Baseline & drift](./baseline-drift.md)
- [Troubleshooting](./troubleshooting.md)
