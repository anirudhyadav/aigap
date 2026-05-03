"""Tests for report/gha_summary.py."""
from __future__ import annotations

from aigap.models.evaluation import EfficacyScore, EvalResult, RuleResult
from aigap.models.report import DriftEntry, DriftReport
from aigap.report.gha_summary import write_step_summary


def _rule(
    rule_id: str,
    *,
    failed: int,
    total: int = 10,
    severity: str = "high",
) -> RuleResult:
    passed = total - failed
    return RuleResult(
        rule_id=rule_id,
        rule_name=rule_id,
        category="policy",
        severity=severity,
        total_pairs=total,
        passed=passed,
        failed=failed,
        skipped=0,
        false_positives=0,
        false_negatives=0,
    )


def _result(rules: list[RuleResult]) -> EvalResult:
    return EvalResult(
        run_id="run1",
        policy_name="P",
        rule_results=rules,
        efficacy=EfficacyScore(
            overall_score=90,
            grade="A",
            coverage_score=88,
            false_positive_rate=1.0,
            false_negative_rate=2.0,
            guardrail_strength="strong",
            recommendations=["Tune dataset"],
        ),
    )


class TestWriteStepSummary:
    def test_no_env_returns_none(self, monkeypatch):
        monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
        r = _result([_rule("a", failed=0)])
        assert write_step_summary(r, None, exit_ok=True) is None

    def test_writes_markdown(self, monkeypatch, tmp_path):
        path = tmp_path / "summary.md"
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(path))
        r = _result([_rule("bad", failed=2)])
        out = write_step_summary(r, None, exit_ok=False)
        assert out == path
        text = path.read_text()
        assert "## aigap" in text
        assert "FAIL" in text
        assert "`bad`" in text
        assert "Tune dataset" in text

    def test_drift_degraded_section(self, monkeypatch, tmp_path):
        path = tmp_path / "summary.md"
        monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(path))
        r = _result([_rule("x", failed=0)])
        drift = DriftReport(
            baseline_run_id="b",
            current_run_id="c",
            entries=[
                DriftEntry(
                    rule_id="x",
                    previous_pass_rate=1.0,
                    current_pass_rate=0.5,
                    delta_pct=-50.0,
                    direction="degraded",
                )
            ],
            overall_delta=-50.0,
            alert=True,
        )
        write_step_summary(r, drift, exit_ok=True)
        assert "Drift" in path.read_text()
        assert "degraded" in path.read_text()
