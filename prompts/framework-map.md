# framework-map.md

**Use when:** You need to map your guardrail policies (GP-NNN) against regulatory and
compliance frameworks — EU AI Act, NIST AI RMF, ISO 42001, SOC 2.

**How to use:**
1. Copy everything below the `---` divider
2. Replace placeholder with your POLICIES.md content
3. Paste into any LLM (Claude, GPT-4, Gemini)
4. Copy the output to `.aigap/framework-map.md`

**VS Code equivalent:** `aigap: Map Compliance Frameworks` (`aigap.frameworkMap`)

---

## Prompt

You are a compliance specialist. Map each guardrail policy in the POLICIES.md below to the
relevant clauses in these frameworks:

- **EU AI Act** (Regulation 2024/1689)
- **NIST AI Risk Management Framework** (AI RMF 1.0)
- **ISO/IEC 42001** (AI Management System)
- **SOC 2** (Trust Services Criteria)

For each mapping, cite the specific article, clause, or criterion. If a policy does not map
to a framework, mark it "N/A" — do not force-fit.

### POLICIES.md

```markdown
[PASTE YOUR .aigap/POLICIES.md HERE]
```

---

### Output format

```markdown
# Framework Compliance Map
_Generated: [DATE] · Source: .aigap/POLICIES.md v[VERSION]_

## Coverage Summary

| Framework | Policies Mapped | Coverage |
|---|---|---|
| EU AI Act | [N] / [Total] | [%] |
| NIST AI RMF | [N] / [Total] | [%] |
| ISO 42001 | [N] / [Total] | [%] |
| SOC 2 | [N] / [Total] | [%] |

---

## Mapping Table

| Policy ID | Policy Name | EU AI Act | NIST AI RMF | ISO 42001 | SOC 2 |
|---|---|---|---|---|---|
| GP-001 | [name] | Art. 9(1) | MAP 1.1 | 6.1.2 | CC6.1 |
| GP-002 | [name] | Art. 15(3) | MEASURE 2.6 | A.5.4 | CC7.2 |
| GP-003 | [name] | N/A | GOVERN 1.3 | 8.2 | N/A |

---

## Framework Detail

### EU AI Act
| Article | Title | Mapped Policies |
|---|---|---|
| Art. 9 | Risk Management System | GP-001, GP-004 |
| Art. 15 | Accuracy, Robustness, Cybersecurity | GP-002 |

### NIST AI RMF
| Function.Category | Mapped Policies |
|---|---|
| GOVERN 1 | GP-003, GP-007 |
| MAP 1 | GP-001 |
| MEASURE 2 | GP-002, GP-005 |

### ISO 42001
| Clause | Title | Mapped Policies |
|---|---|---|
| 6.1.2 | AI risk assessment | GP-001 |
| A.5.4 | AI system impact assessment | GP-002 |

### SOC 2
| Criterion | Title | Mapped Policies |
|---|---|---|
| CC6.1 | Logical and physical access controls | GP-001 |
| CC7.2 | System monitoring | GP-002 |

---

## Gaps

Policies not covered by any framework (may need custom compliance justification):

| Policy ID | Policy Name | Recommendation |
|---|---|---|
| GP-[NNN] | [name] | [suggestion] |
```

---

## After running

- [ ] Commit to `.aigap/framework-map.md`
- [ ] Review with compliance officer before external audit
- [ ] Create tickets for any framework gaps
- [ ] Update when frameworks are revised or new policies are added
