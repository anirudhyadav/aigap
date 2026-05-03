# Enforcement Stubs — Customer Support Bot

## EV-001: Output Filter — PII & Competitor Scan

```python
# enforcement/output_filter.py
import re

PII_PATTERNS = [
    r'\b\d{3}-\d{2}-\d{4}\b',           # SSN
    r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',  # Credit card
    r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',   # Phone
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
]

COMPETITORS = ["competitorA", "competitorB"]

def scan_response(text: str) -> list[str]:
    findings = []
    for pattern in PII_PATTERNS:
        if re.search(pattern, text):
            findings.append(f"PII detected: {pattern}")
    for comp in COMPETITORS:
        if comp.lower() in text.lower():
            findings.append(f"Competitor mention: {comp}")
    return findings
```

## EV-002: Pre-Call Hook — Injection Detection

```python
# enforcement/injection_filter.py
INJECTION_SIGNALS = [
    "ignore previous", "forget your instructions",
    "you are now", "new persona", "system prompt"
]

def detect_injection(prompt: str) -> bool:
    lower = prompt.lower()
    return any(signal in lower for signal in INJECTION_SIGNALS)
```

## EV-003: Test Assertion — Quality Checks

```python
# enforcement/quality_tests.py
def assert_english_only(response: str):
    for char in response:
        if ord(char) > 0x4E00 and ord(char) < 0x9FFF:
            raise AssertionError("GP-005: Non-English characters detected")

def assert_has_sources(response: str):
    source_indicators = ["source:", "reference:", "according to", "per our"]
    if not any(s in response.lower() for s in source_indicators):
        raise AssertionError("GP-004: Response should cite sources")
```
