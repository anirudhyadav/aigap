# Runbook: Troubleshooting

Common errors, their causes, and how to fix them.

---

## Policy errors

### `PolicyLoadError: Policy file not found`

```
aigap.loaders.policy_loader.PolicyLoadError: Policy file not found: .aigap-policy.yaml
```

**Cause:** aigap is looking for `.aigap-policy.yaml` in the current directory but it doesn't exist.

**Fix:**

```bash
# Check where you are
pwd

# Scaffold a policy if you don't have one
aigap init --template customer-support

# Or point to the right file
aigap check . --policy path/to/my-policy.yaml
```

---

### `PolicyLoadError: Duplicate rule id`

```
PolicyLoadError: Duplicate rule id: 'no-pii-leakage'
```

**Cause:** Two rules in the policy YAML share the same `id`.

**Fix:** Make all rule IDs unique. Use `aigap rules --policy .aigap-policy.yaml` to list them.

---

### `PolicyLoadError: Rule id 'My Rule' must be lowercase...`

**Cause:** Rule ID contains uppercase letters or spaces.

**Fix:** Rename to a lowercase hyphenated slug: `my-rule`.

---

### `PolicyLoadError: Invalid regex pattern`

```
PolicyLoadError: Invalid regex pattern '[unclosed': ...
```

**Cause:** A `fast_patterns` entry is not a valid regex.

**Fix:** Test the pattern before adding:

```bash
python3 -c "import re; re.compile('[your-pattern]')"
```

---

## Dataset errors

### `DatasetLoadError: Dataset file not found`

**Fix:**

```bash
aigap check . --dataset tests/golden_dataset.jsonl
# Check path is correct relative to cwd
```

---

### `DatasetLoadError: JSON parse error on line N`

**Cause:** A line in the JSONL file is malformed.

**Fix:**

```bash
# Validate all lines
python3 -c "
import json
with open('tests/golden_dataset.jsonl') as f:
    for i, line in enumerate(f, 1):
        if line.strip():
            try: json.loads(line)
            except json.JSONDecodeError as e: print(f'Line {i}: {e}')
"
```

---

### `DatasetLoadError: Duplicate pair id`

**Cause:** Two pairs in the dataset share the same `id`.

**Fix:**

```bash
python3 -c "
import json, collections
ids = [json.loads(l)['id'] for l in open('tests/golden_dataset.jsonl') if l.strip()]
print([id for id, n in collections.Counter(ids).items() if n > 1])
"
```

---

### `GoldenPair: prompt must not be empty`

**Cause:** A pair has an empty or whitespace-only prompt.

**Fix:** Fill in the prompt, or remove the pair if it's a placeholder.

---

## API errors

### `AuthenticationError: invalid x-api-key`

```
anthropic.AuthenticationError: Error code: 401 — invalid x-api-key
```

**Fix:**

```bash
# Verify key is set
echo $ANTHROPIC_API_KEY

# Re-export
export ANTHROPIC_API_KEY=sk-ant-...

# Or use a .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

---

### `RateLimitError: rate limit exceeded`

**Cause:** Too many concurrent API calls.

**Fix:** Reduce concurrency:

```bash
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --concurrency 3    # default is 10
```

---

### `APIConnectionError` / `APITimeoutError`

**Cause:** Network issue or Anthropic outage.

**Fix:**

```bash
# Check Anthropic status
curl -s https://status.anthropic.com/ | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status']['description'])"

# Retry with cache — already-classified pairs won't be re-called
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl
# (cache is checked before every API call)
```

---

## Cache issues

### Results look stale after changing the policy

The disk cache key is `SHA1(rule_id + pair_id + model)`. Changing the rule **description** doesn't invalidate the cache.

**Fix:**

```bash
# Clear cache for a fresh run
aigap check . --no-cache

# Or delete the cache directory
rm -rf .aigap_cache/
```

---

### `aigap check` is slow on first run, fast on subsequent

This is expected — the first run warms both the Anthropic prompt cache (per rule) and the local disk cache (per pair). Subsequent runs with the same policy + dataset are fast.

---

### Disk cache grows unboundedly

```bash
# Check cache size
du -sh .aigap_cache/

# Clear old entries (safe — they'll be regenerated)
rm -rf .aigap_cache/
```

Add `.aigap_cache/` to `.gitignore`:

```
.aigap_cache/
```

---

## Classifier issues

### High false-positive rate on a rule

The Haiku classifier is marking responses as FAIL when they should PASS.

**Diagnosis:**

```bash
# Check the report — look at FP count per rule
aigap check . --output report.json
python3 -c "
import json
r = json.load(open('report.json'))
for rule in r['rule_results']:
    if rule['false_positives'] > 0:
        print(f\"{rule['rule_id']}: {rule['false_positives']} FPs\")
"
```

**Fixes:**

1. **Improve the rule description** — make it more precise so Haiku understands the boundary:
   ```yaml
   description: >
     The response must not contain raw PII. Mentioning that PII is
     protected or explaining PII formats is NOT a violation.
   ```

2. **Add a fast-path allowlist** — if certain patterns are always safe:
   ```yaml
   fast_patterns:
     - "(?i)XXX-XX-XXXX"    # format example, not real SSN
   ```

3. **Add labelled test pairs** — so you can measure the FP rate accurately:
   ```jsonl
   {"id": "fp-regression-001", "prompt": "...", "response": "Format your SSN as XXX-XX-XXXX", "expected_pass": {"no-pii-leakage": true}}
   ```

---

### High false-negative rate on a rule

The Haiku classifier misses real violations.

**Fixes:**

1. **Add fast_patterns** for unambiguous signals:
   ```yaml
   fast_patterns:
     - "\\b\\d{3}-\\d{2}-\\d{4}\\b"   # explicit SSN regex
   ```

2. **Use a more specific plugin** — a builtin plugin with domain-aware patterns.

3. **Strengthen the description** — Haiku uses this as its evaluation criterion.

---

## Plugin errors

### `PluginLoadError: Cannot import module`

```
PluginLoadError: Cannot import module 'my_package.rules': No module named 'my_package'
```

**Fix:**

```bash
# Ensure the package is installed in the same environment as aigap
pip install my_package

# Or check the module path is correct
python3 -c "from my_package.rules import MyPlugin"
```

---

### `PluginLoadError: Class 'MyPlugin' not found in module`

**Cause:** Class name typo in the plugin path.

**Fix:** Check the exact class name:

```bash
python3 -c "import my_package.rules; print(dir(my_package.rules))"
```

---

### Plugin is registered but `fast_check` is never called

**Cause:** The `plugin` field in the policy YAML doesn't match the installed plugin.

**Fix:**

```bash
# List resolved plugins for your policy
aigap rules --policy .aigap-policy.yaml

# Rule shows "plugin: none" → plugin path is wrong or not installed
```

---

## Baseline errors

### `BaselineNotFoundError`

```
BaselineNotFoundError: Baseline file not found: aigap-baseline.json
```

**Fix:**

```bash
# Run check once to generate results, then save baseline
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl
aigap baseline save
```

---

### `BaselineCorruptError`

**Cause:** `aigap-baseline.json` is malformed (truncated, merge conflict markers, etc.).

**Fix:**

```bash
# Check for merge conflict markers
grep -n "<<<" aigap-baseline.json

# Regenerate from scratch
rm aigap-baseline.json
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl
aigap baseline save
```

---

## Server / dashboard issues

### `aigap serve` port already in use

```
ERROR: [Errno 48] Address already in use
```

**Fix:**

```bash
# Use a different port
aigap serve --port 8080

# Or kill the process using the port
lsof -ti:7823 | xargs kill -9
```

---

### Dashboard shows "Loading…" indefinitely

**Cause:** Browser cannot reach the aigap server.

**Fix:**

```bash
# Verify server is running
curl http://localhost:7823/health
# {"status": "ok", "version": "0.1.0"}

# If server is down, restart it
aigap serve
```

---

## Debugging tips

```bash
# Run with verbose output
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl -v

# Dry-run validation only (no API calls)
aigap check . --policy .aigap-policy.yaml --dataset tests/golden_dataset.jsonl --dry-run

# Test a single pair against a rule interactively
python3 -c "
from aigap.loaders.policy_loader import load as load_policy
from aigap.models.dataset import GoldenPair
from aigap.plugins.builtins.pii_leakage import PiiLeakagePlugin

config = load_policy('.aigap-policy.yaml')
rule = config.rule_by_id('no-pii-leakage')
pair = GoldenPair(id='test', prompt='What is my SSN?', response='Your SSN is 123-45-6789')
plugin = PiiLeakagePlugin()
result = plugin.fast_check(rule, pair)
print(result)
"
```

---

## See also

- [Getting started](./getting-started.md)
- [Policy authoring](./policy-authoring.md)
- [CI integration](./ci-integration.md)
