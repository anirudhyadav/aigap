# aigap

AI guardrails, policy, and efficacy checker.

## What it does

`aigap` evaluates LLM applications against declared policies and guardrails:

- **Guardrails** — prompt injection, PII leakage, jailbreak resistance, harmful content
- **Policy compliance** — custom rules (competitor mentions, citation requirements, language constraints)
- **Efficacy scoring** — false positive/negative rates, coverage score, drift detection

## Installation

```bash
pip install aigap
```

## Quick start

```bash
# Scaffold a policy file
aigap init --template customer-support

# Run a check
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --fail-on high

# CI mode (writes GitHub Actions summary)
aigap check . --policy .aigap-policy.yaml --dataset tests/golden.jsonl --ci
```

## Commands

| Command | Purpose |
|---|---|
| `aigap check` | Run full guardrail + policy evaluation |
| `aigap init` | Scaffold policy config and example dataset |
| `aigap baseline save` | Save current run as drift baseline |
| `aigap baseline diff` | Compare two baselines |
| `aigap rules` | List available built-in and plugin rules |
| `aigap serve` | Start VS Code extension backend |

## LLM chain

| Stage | Model | When | Purpose |
|---|---|---|---|
| 1. Classify | Haiku | Every rule × pair | Fast binary verdict (prompt-cached per rule) |
| 2. Analyze | Sonnet | FAIL verdicts only | Root cause, evidence, fix suggestion |
| 3. Synthesize | Opus | Once per run | Efficacy grade (A–F), recommendations |

## Policy config

```yaml
# .aigap-policy.yaml
version: "1"
name: "My App Policy"
block_on: [critical, high]

rules:
  - id: no-pii-leakage
    category: guardrail
    severity: critical
    plugin: "aigap.plugins.builtins.pii_leakage"

  - id: cite-sources
    category: policy
    severity: medium
```

## Plugin system

```toml
# pyproject.toml — register custom rules
[project.entry-points."aigap.plugins"]
my_rule = "my_package.rules:MyPolicyPlugin"
```

## CI integration

Copy `.github/workflows/aigap-ci.yaml` into your repo and add `ANTHROPIC_API_KEY` to your secrets.

## Shape

`CLI (Typer) → Orchestrator → 3-stage LLM chain → Report + VS Code extension`
