"""Markdown report generator — turns an EvalResult into a readable .md file."""
from __future__ import annotations

from pathlib import Path

from aigap.models.evaluation import EvalResult, RuleResult
from aigap.models.report import DriftReport


def write(
    result: EvalResult,
    path:   str | Path,
    drift:  DriftReport | None = None,
) -> Path:
    """
    Render result as a Markdown report and write it to disk.

    Returns the resolved Path that was written.
    """
    path = Path(path)
    if path.suffix != ".md":
        path = path.with_suffix(".md")

    path.write_text(render(result, drift), encoding="utf-8")
    return path


def render(result: EvalResult, drift: DriftReport | None = None) -> str:
    """Return the full Markdown report as a string (no file I/O)."""
    sections: list[str] = []

    sections.append(_header(result))
    sections.append(_efficacy_section(result))
    sections.append(_rules_section(result, drift))
    sections.append(_failures_section(result))
    if result.efficacy.recommendations:
        sections.append(_recommendations_section(result))
    if drift:
        sections.append(_drift_section(drift))

    return "\n\n".join(sections) + "\n"


# ── Section renderers ─────────────────────────────────────────────────────────

def _header(result: EvalResult) -> str:
    return (
        f"# aigap Report — {result.policy_name}\n\n"
        f"**Run ID:** `{result.run_id}`  \n"
        f"**Timestamp:** {result.timestamp}"
    )


def _efficacy_section(result: EvalResult) -> str:
    e = result.efficacy
    bar = _score_bar(e.overall_score)
    return (
        "## Efficacy\n\n"
        f"| Metric | Value |\n"
        f"|---|---|\n"
        f"| Grade | **{e.grade}** |\n"
        f"| Score | **{e.overall_score:.0f} / 100** |\n"
        f"| Coverage | {e.coverage_score:.1f}% |\n"
        f"| False-positive rate | {e.false_positive_rate:.1f}% |\n"
        f"| False-negative rate | {e.false_negative_rate:.1f}% |\n"
        f"| Guardrail strength | {e.guardrail_strength} |\n\n"
        f"{bar}"
    )


def _rules_section(result: EvalResult, drift: DriftReport | None) -> str:
    drift_map = {}
    if drift:
        drift_map = {e.rule_id: e for e in drift.entries}

    rows = ["## Rules\n", "| Rule | Category | Severity | Pass rate | Drift |", "|---|---|---|---|---|"]
    for r in result.rule_results:
        pct   = f"{r.pass_rate * 100:.0f}%  ({r.passed}/{r.total_pairs})"
        entry = drift_map.get(r.rule_id)
        if entry:
            sign  = "↑" if entry.delta_pct > 0 else ("↓" if entry.delta_pct < 0 else "─")
            delta = f"{sign} {abs(entry.delta_pct):.1f}pp"
        else:
            delta = "─"
        rows.append(f"| {r.rule_name} `{r.rule_id}` | {r.category} | {r.severity} | {pct} | {delta} |")

    return "\n".join(rows)


def _failures_section(result: EvalResult) -> str:
    failing = [r for r in result.rule_results if r.failed > 0]
    if not failing:
        return "## Failures\n\n_No failures — all rules passing._"

    lines = ["## Failures"]
    for r in sorted(failing, key=lambda x: x.failure_rate, reverse=True):
        lines.append(f"\n### {r.rule_name} (`{r.rule_id}`)")
        lines.append(f"Pass rate: {r.pass_rate * 100:.0f}%  |  FP: {r.false_positives}  |  FN: {r.false_negatives}\n")
        for i, a in enumerate(r.analyses, 1):
            lines.append(f"**Failure {i}** — pair `{a.pair_id}` — priority: _{a.fix_priority}_\n")
            if a.evidence:
                lines.append(f"> {a.evidence}\n")
            lines.append(f"**Root cause:** {a.root_cause}\n")
            lines.append(f"**Suggested fix:** {a.suggested_fix}\n")

    return "\n".join(lines)


def _recommendations_section(result: EvalResult) -> str:
    lines = ["## Recommendations\n"]
    for i, rec in enumerate(result.efficacy.recommendations, 1):
        lines.append(f"{i}. {rec}")
    return "\n".join(lines)


def _drift_section(drift: DriftReport) -> str:
    lines = [
        "## Drift\n",
        f"Baseline run: `{drift.baseline_run_id}`  |  "
        f"Overall delta: **{drift.overall_delta:+.1f}pp**  |  "
        f"Alert: {'⚠️ Yes' if drift.alert else '✅ No'}\n",
        "| Rule | Previous | Current | Delta | Direction |",
        "|---|---|---|---|---|",
    ]
    for e in drift.entries:
        lines.append(
            f"| {e.rule_id} "
            f"| {e.previous_pass_rate * 100:.0f}% "
            f"| {e.current_pass_rate * 100:.0f}% "
            f"| {e.delta_pct:+.1f}pp "
            f"| {e.direction} |"
        )
    return "\n".join(lines)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _score_bar(score: float, width: int = 20) -> str:
    filled = int(score / 100 * width)
    bar    = "█" * filled + "░" * (width - filled)
    return f"`{bar}` {score:.0f}/100"
