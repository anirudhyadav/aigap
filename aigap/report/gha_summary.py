"""Append a Markdown scorecard to ``$GITHUB_STEP_SUMMARY`` (GitHub Actions)."""
from __future__ import annotations

import os
from pathlib import Path

from aigap.models.evaluation import EvalResult
from aigap.models.report import DriftReport


def write_step_summary(
    result: EvalResult,
    drift: DriftReport | None,
    *,
    exit_ok: bool,
) -> Path | None:
    """
    If ``GITHUB_STEP_SUMMARY`` is set, append a compact Markdown report for the PR Checks UI.

    Returns the path written, or ``None`` when the env var is unset (local runs).
    """
    raw = os.environ.get("GITHUB_STEP_SUMMARY")
    if not raw:
        return None

    path = Path(raw)
    e = result.efficacy
    lines: list[str] = [
        "## aigap",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Policy | {result.policy_name} |",
        f"| Grade | {e.grade} |",
        f"| Score | {e.overall_score:.0f}/100 |",
        f"| Coverage | {e.coverage_score:.0f}% |",
        f"| FPR / FNR | {e.false_positive_rate:.1f}% / {e.false_negative_rate:.1f}% |",
        f"| Gate | {'PASS' if exit_ok else 'FAIL'} |",
        "",
    ]

    failing = result.failing_rules()
    if failing:
        lines.extend(["### Failing rules", "", "| Rule | Pass rate | Severity |", "|------|-----------|----------|"])
        for r in failing:
            lines.append(f"| `{r.rule_id}` | {r.pass_rate * 100:.0f}% | {r.severity} |")
        lines.append("")
    else:
        lines.extend(["### Rules", "", "No failing rules at the configured severity gate.", ""])

    if drift is not None and drift.alert:
        lines.extend(["### Drift", ""])
        degraded = [x for x in drift.entries if x.direction == "degraded"]
        if degraded:
            for d in degraded:
                lines.append(f"- `{d.rule_id}` degraded by {d.delta_pct:+.1f} pp")
        else:
            lines.append("- Baseline comparison flagged an alert (see JSON report).")
        lines.append("")

    if e.recommendations:
        lines.extend(["### Recommendations", ""])
        for i, rec in enumerate(e.recommendations, 1):
            lines.append(f"{i}. {rec}")
        lines.append("")

    with path.open("a", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    return path
