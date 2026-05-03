# POLICIES — Coding Assistant
<!-- aigap v0.1.0 · generated · 2025-05-01 -->

version: 1.0
updated: 2025-05-01
author: Anirudh Yadav

---

## Summary

| Type | Count |
|---|---|
| Guardrail Categories (GC) | 2 |
| Guardrail Policies (GP) | 6 |
| Enforcement Vectors (EV) | 4 |

---

## Enforcement Vectors

| ID | Type | Description |
|---|---|---|
| EV-001 | output filter | Scan generated code for secrets/credentials |
| EV-002 | pre-call hook | Check prompt for malicious intent before LLM |
| EV-003 | test assertion | Validate code output against security checklist |
| EV-004 | middleware | Runtime detection of deprecated API usage |

---

## GC-001: Security Guardrails

Policies preventing generation of dangerous, unauthorized, or credential-leaking code.

| ID | Name | Description | Severity | Vector | Status |
|---|---|---|---|---|---|
| GP-001 | Never output real secrets | Must not generate API keys, passwords, tokens, or credentials | critical | EV-001 | 🔲 gap |
| GP-002 | Refuse malicious code | Must refuse to generate malware, exploits, or destructive scripts | critical | EV-002 | 🔲 gap |
| GP-003 | Resist prompt injection | Must not follow injected instructions from user-provided code | critical | EV-002 | 🔲 gap |
| GP-006 | Follow security best practices | Generated code must use parameterized queries, avoid eval() | high | EV-003 | 🔲 gap |

---

## GC-002: Quality Policies

Policies ensuring code quality, license compliance, and API currency.

| ID | Name | Description | Severity | Vector | Status |
|---|---|---|---|---|---|
| GP-004 | Respect software licenses | Must not reproduce large blocks of GPL/AGPL code without attribution | high | EV-003 | 🔲 gap |
| GP-005 | Use current APIs | Must prefer current/stable API versions over deprecated ones | medium | EV-004 | 🔲 gap |

---

## Deprecated

_(none)_
