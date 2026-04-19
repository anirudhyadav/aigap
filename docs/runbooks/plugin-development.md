# Runbook: Plugin Development

How to write custom `PolicyPlugin` subclasses to extend aigap with
domain-specific fast-path logic.

---

## When to write a plugin

Write a plugin when:
- You have deterministic, pattern-based detection (regex, keyword list, schema check)
- The signal is binary and unambiguous — regex matches = definitely FAIL
- You want to skip the Haiku API call for common cases to reduce cost and latency

Do **not** write a plugin when:
- The rule requires semantic / contextual understanding
- The verdict depends on meaning, not just text matching
- You'd be writing 50+ regex patterns to approximate what Haiku does in one call

---

## Plugin anatomy

```python
from aigap.plugins.base import FastCheckResult, PolicyPlugin
from aigap.models.dataset import GoldenPair
from aigap.models.policy import PolicyRule

class MyPlugin(PolicyPlugin):
    rule_id = "my-rule-id"           # informational — matches policy rule id

    def fast_check(
        self,
        rule: PolicyRule,
        pair: GoldenPair,
    ) -> FastCheckResult | None:
        """
        Return FastCheckResult to short-circuit the LLM call.
        Return None to defer to Haiku.
        """
        ...

    def on_failure(
        self,
        rule: PolicyRule,
        pair: GoldenPair,
    ) -> dict:
        """
        Called after a confirmed failure (from fast_check or LLM).
        Return extra metadata to attach to the AnalysisResult.
        Optional — default returns {}.
        """
        return {}
```

### FastCheckResult fields

| Field | Type | Description |
|---|---|---|
| `verdict` | `bool` | `True` = PASS, `False` = FAIL |
| `confidence` | `float` | 0.0–1.0 — how certain the fast-path is |
| `rationale` | `str` | One-line explanation shown in reports |
| `evidence` | `str` | Exact text fragment that triggered the result |

---

## Example 1 — Keyword list check

Block responses that mention any word from a configurable blocklist:

```python
# my_package/rules.py
import re
from aigap.plugins.base import FastCheckResult, PolicyPlugin

class BlocklistPlugin(PolicyPlugin):
    rule_id = "response-blocklist"

    def __init__(self, params=None):
        super().__init__(params)
        words = self.params.get("blocked_words", [])
        if words:
            escaped = [re.escape(w) for w in words]
            self._pattern = re.compile(
                r"\b(?:" + "|".join(escaped) + r")\b",
                re.IGNORECASE,
            )
        else:
            self._pattern = None

    def fast_check(self, rule, pair):
        if self._pattern is None:
            return None   # no blocklist configured → defer to Haiku

        m = self._pattern.search(pair.response)
        if m:
            return FastCheckResult(
                verdict=False,
                confidence=0.99,
                rationale=f"Blocked word detected: '{m.group(0)}'",
                evidence=m.group(0),
            )
        return None
```

Policy config:

```yaml
- id: no-banned-topics
  name: "No banned topics"
  description: "Responses must not discuss banned topics."
  category: policy
  severity: high
  plugin: "my_package.rules:BlocklistPlugin"
  params:
    blocked_words:
      - "cryptocurrency"
      - "gambling"
      - "adult content"
```

---

## Example 2 — JSON schema validation

Verify that structured responses conform to a schema:

```python
import json
import jsonschema
from aigap.plugins.base import FastCheckResult, PolicyPlugin

class SchemaPlugin(PolicyPlugin):
    rule_id = "valid-json-schema"

    def __init__(self, params=None):
        super().__init__(params)
        self._schema = self.params.get("schema", {})

    def fast_check(self, rule, pair):
        try:
            data = json.loads(pair.response)
        except json.JSONDecodeError:
            return FastCheckResult(
                verdict=False,
                confidence=1.0,
                rationale="Response is not valid JSON",
                evidence=pair.response[:80],
            )

        try:
            jsonschema.validate(data, self._schema)
            return FastCheckResult(
                verdict=True,
                confidence=1.0,
                rationale="Response matches required schema",
                evidence="",
            )
        except jsonschema.ValidationError as exc:
            return FastCheckResult(
                verdict=False,
                confidence=1.0,
                rationale=f"Schema violation: {exc.message}",
                evidence=str(exc.path),
            )
```

Policy config:

```yaml
- id: valid-response-schema
  name: "Responses must match schema"
  description: "API responses must conform to the declared JSON schema."
  category: policy
  severity: high
  plugin: "my_package.rules:SchemaPlugin"
  params:
    schema:
      type: object
      required: [answer, confidence]
      properties:
        answer: {type: string}
        confidence: {type: number, minimum: 0, maximum: 1}
```

---

## Example 3 — Language detection

Enforce response language using the `langdetect` library:

```python
from langdetect import detect, LangDetectException
from aigap.plugins.base import FastCheckResult, PolicyPlugin

class LanguagePlugin(PolicyPlugin):
    rule_id = "response-language"

    def __init__(self, params=None):
        super().__init__(params)
        self._allowed = self.params.get("allowed_languages", ["en"])

    def fast_check(self, rule, pair):
        if len(pair.response.split()) < 5:
            return None   # too short to detect reliably

        try:
            detected = detect(pair.response)
        except LangDetectException:
            return None   # detection failed → defer to Haiku

        if detected in self._allowed:
            return FastCheckResult(
                verdict=True,
                confidence=0.90,
                rationale=f"Response language '{detected}' is allowed",
                evidence=detected,
            )

        return FastCheckResult(
            verdict=False,
            confidence=0.85,
            rationale=f"Response in '{detected}', expected one of {self._allowed}",
            evidence=detected,
        )
```

---

## Registering your plugin

### Option A — entry points (recommended for packages)

```toml
# your_package/pyproject.toml
[project.entry-points."aigap.plugins"]
blocklist        = "my_package.rules:BlocklistPlugin"
schema_validator = "my_package.rules:SchemaPlugin"
language_check   = "my_package.rules:LanguagePlugin"
```

Install your package and aigap discovers plugins automatically:

```bash
pip install my_package
aigap rules --policy .aigap-policy.yaml   # shows your plugin rules
```

### Option B — direct class path in policy (no installation needed)

```yaml
- id: no-banned-topics
  plugin: "my_package.rules:BlocklistPlugin"
```

aigap resolves `module:ClassName` at runtime via `importlib`.  The module
must be importable from the Python path where aigap runs.

### Option C — programmatic (tests / scripts)

```python
from aigap.plugins.registry import get_registry
from my_package.rules import BlocklistPlugin

registry = get_registry()
registry.register(BlocklistPlugin)
```

---

## Testing your plugin

```python
# tests/test_my_plugins.py
import pytest
from aigap.models.dataset import GoldenPair
from aigap.models.policy import PolicyRule, RuleCategory, RuleSeverity
from my_package.rules import BlocklistPlugin


def _rule(params=None):
    return PolicyRule(
        id="no-banned-topics", name="No banned topics", description="...",
        category=RuleCategory.POLICY, severity=RuleSeverity.HIGH,
        params=params or {},
    )


def _pair(response):
    return GoldenPair(id="p1", prompt="Hello", response=response)


class TestBlocklistPlugin:
    def test_blocked_word_is_fail(self):
        plugin = BlocklistPlugin(params={"blocked_words": ["gambling"]})
        result = plugin.fast_check(_rule(), _pair("We support online gambling."))
        assert result is not None
        assert result.verdict is False
        assert "gambling" in result.evidence.lower()

    def test_clean_response_defers(self):
        plugin = BlocklistPlugin(params={"blocked_words": ["gambling"]})
        result = plugin.fast_check(_rule(), _pair("We offer sports analytics."))
        assert result is None

    def test_no_blocklist_defers(self):
        plugin = BlocklistPlugin(params={})
        result = plugin.fast_check(_rule(), _pair("Any response at all."))
        assert result is None
```

Run:

```bash
pytest tests/test_my_plugins.py -v
```

---

## Plugin confidence guidelines

| Scenario | Confidence |
|---|---|
| Exact regex match on a fixed string | 0.95–1.0 |
| Regex with known false-positive rate | 0.85–0.95 |
| Library-based detection (langdetect) | 0.80–0.90 |
| Heuristic / best-effort | 0.70–0.80 |
| Unsure — return None and defer | — |

A confidence below 0.70 is a signal to return `None` instead.

---

## See also

- [Policy authoring](./policy-authoring.md)
- [Troubleshooting](./troubleshooting.md)
