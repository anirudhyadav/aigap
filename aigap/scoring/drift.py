"""
Drift scoring: compare a current EvalResult to a saved baseline.

The baseline is a JSON file (aigap-baseline.json) written by `aigap baseline save`.
Drift is computed per-rule as (current_pass_rate - baseline_pass_rate) in
percentage points.  A negative delta means the rule degraded.
"""
from __future__ import annotations

import json
from pathlib import Path

from aigap.models.evaluation import EvalResult, RuleResult
from aigap.models.report import DriftEntry, DriftReport


class BaselineNotFoundError(Exception):
    pass


class BaselineCorruptError(Exception):
    pass


# ── Public API ────────────────────────────────────────────────────────────────

def compute(
    current: EvalResult,
    baseline_path: str | Path,
    drift_threshold_pct: float = 5.0,
) -> DriftReport:
    """
    Compare current run against the saved baseline.

    Args:
        current:             The EvalResult from the latest run.
        baseline_path:       Path to the baseline JSON file.
        drift_threshold_pct: Flag alert=True if any rule degrades more than this.

    Returns a DriftReport with per-rule delta entries.
    Raises BaselineNotFoundError / BaselineCorruptError on I/O or parse problems.
    """
    baseline = _load_baseline(Path(baseline_path))
    entries  = _build_entries(current.rule_results, baseline)
    deltas   = [e.delta_pct for e in entries]
    overall  = round(sum(deltas) / len(deltas), 2) if deltas else 0.0
    alert    = any(e.delta_pct < -drift_threshold_pct for e in entries)

    return DriftReport(
        baseline_run_id = baseline.get("run_id", "unknown"),
        current_run_id  = current.run_id,
        entries         = entries,
        overall_delta   = overall,
        alert           = alert,
    )


def save_baseline(result: EvalResult, path: str | Path) -> None:
    """Serialise a minimal baseline snapshot to JSON."""
    path = Path(path)
    snapshot = {
        "run_id":    result.run_id,
        "timestamp": result.timestamp,
        "rules": {
            r.rule_id: {
                "pass_rate":   r.pass_rate,
                "total_pairs": r.total_pairs,
            }
            for r in result.rule_results
        },
    }
    path.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")


# ── Internal helpers ──────────────────────────────────────────────────────────

def _load_baseline(path: Path) -> dict:
    if not path.exists():
        raise BaselineNotFoundError(
            f"Baseline file not found: {path}\n"
            "Run 'aigap baseline save' after your first successful check."
        )
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        raise BaselineCorruptError(f"Cannot read baseline {path}: {exc}") from exc


def _build_entries(
    current_rules: list[RuleResult],
    baseline: dict,
) -> list[DriftEntry]:
    baseline_rules: dict[str, dict] = baseline.get("rules", {})
    entries: list[DriftEntry] = []

    for rule in current_rules:
        current_rate = rule.pass_rate

        if rule.rule_id not in baseline_rules:
            # New rule added since baseline — treat as no change
            entries.append(DriftEntry(
                rule_id            = rule.rule_id,
                previous_pass_rate = current_rate,
                current_pass_rate  = current_rate,
                delta_pct          = 0.0,
                direction          = "stable",
            ))
            continue

        prev_rate = baseline_rules[rule.rule_id]["pass_rate"]
        delta     = round((current_rate - prev_rate) * 100, 2)
        direction = "stable" if delta == 0 else ("improved" if delta > 0 else "degraded")

        entries.append(DriftEntry(
            rule_id            = rule.rule_id,
            previous_pass_rate = prev_rate,
            current_pass_rate  = current_rate,
            delta_pct          = delta,
            direction          = direction,
        ))

    return entries
