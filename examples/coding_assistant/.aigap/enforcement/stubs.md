# Enforcement Stubs — Coding Assistant

## EV-001: Output Filter — Secret Detection

```python
# enforcement/secret_scanner.py
import re

PATTERNS = [
    r'(?i)AKIA[0-9A-Z]{16}',         # AWS access key
    r'(?i)sk-[a-zA-Z0-9]{48}',        # OpenAI key
    r'(?i)ghp_[a-zA-Z0-9]{36}',       # GitHub PAT
    r'(?i)password\s*=\s*["\'][^"\']{8,}',  # Hardcoded password
]

def scan_output(code: str) -> list[str]:
    findings = []
    for pattern in PATTERNS:
        if re.search(pattern, code):
            findings.append(f"Secret pattern detected: {pattern}")
    return findings
```

## EV-002: Pre-Call Hook — Malicious Intent Check

```python
# enforcement/intent_filter.py
BLOCKED_INTENTS = [
    "keylogger", "brute force", "exploit",
    "ransomware", "reverse shell", "bypass auth"
]

def check_intent(prompt: str) -> bool:
    lower = prompt.lower()
    return any(intent in lower for intent in BLOCKED_INTENTS)
```

## EV-003: Test Assertion — Security Checklist

```python
# enforcement/security_test.py
def assert_no_eval(code: str):
    assert "eval(" not in code, "GP-006: eval() is not allowed"

def assert_parameterized_queries(code: str):
    assert "f\"SELECT" not in code, "GP-006: Use parameterized queries"
```

## EV-004: Middleware — Deprecation Warning

```python
# enforcement/deprecation_check.py
DEPRECATED = {"urllib2": "urllib.request", "optparse": "argparse"}

def check_deprecated(code: str) -> list[str]:
    return [f"Deprecated: {old} → use {new}"
            for old, new in DEPRECATED.items() if old in code]
```
