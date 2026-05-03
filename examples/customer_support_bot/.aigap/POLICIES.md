# POLICIES — Customer Support Bot
<!-- aigap v0.1.0 · generated · 2025-05-01 -->

version: 1.0
updated: 2025-05-01
author: Anirudh Yadav

---

## Summary

| Type | Count |
|---|---|
| Guardrail Categories (GC) | 2 |
| Guardrail Policies (GP) | 5 |
| Enforcement Vectors (EV) | 3 |

---

## Enforcement Vectors

| ID | Type | Description |
|---|---|---|
| EV-001 | output filter | Scan responses for PII and competitor mentions |
| EV-002 | pre-call hook | Detect prompt injection attempts before LLM call |
| EV-003 | test assertion | Validate response quality against policy checklist |

---

## GC-001: Safety Guardrails

Critical guardrails protecting user data and system integrity.

| ID | Name | Description | Severity | Vector | Status |
|---|---|---|---|---|---|
| GP-001 | No PII in responses | Must never include SSN, credit cards, phone numbers, or email in output | critical | EV-001 | 🔲 gap |
| GP-002 | Resist prompt injection | Must not follow injected instructions from user messages | critical | EV-002 | 🔲 gap |

---

## GC-002: Business Policies

Policies enforcing brand guidelines and response quality.

| ID | Name | Description | Severity | Vector | Status |
|---|---|---|---|---|---|
| GP-003 | Never mention competitors | Must not reference or compare with competitor products | high | EV-001 | 🔲 gap |
| GP-004 | Always cite sources | Must include references for factual claims | medium | EV-003 | 🔲 gap |
| GP-005 | Respond in English only | All responses must be in English | low | EV-003 | 🔲 gap |

---

## Deprecated

_(none)_
