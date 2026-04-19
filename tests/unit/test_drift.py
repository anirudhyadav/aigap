"""Tests for scoring/drift.py."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from aigap.models.evaluation import EfficacyScore, EvalResult, RuleResult
from aigap.scoring.drift import (
    BaselineCorruptError,
    BaselineNotFoundError,
    compute,
    save_baseline,
)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _make_rule(rule_id: str, total: int, passed: int) -> RuleResult:
    return RuleResult(
        rule_id=rule_id, rule_name=rule_id, category="policy", severity="medium",
        total_pairs=total, passed=passed, failed=total - passed,
        skipped=0, false_positives=0, false_negatives=0,
    )


def _make_eval(rules: list[RuleResult]) -> EvalResult:
    return EvalResult(
        run_id="test-run",
        policy_name="Test Policy",
        rule_results=rules,
        efficacy=EfficacyScore(
            overall_score=80, grade="B", coverage_score=85,
            false_positive_rate=2.0, false_negative_rate=5.0,
            guardrail_strength="moderate",
        ),
    )


# ── save_baseline ─────────────────────────────────────────────────────────────


class TestSaveBaseline:
    def test_writes_json(self, tmp_path):
        rules = [_make_rule("r1", 10, 10), _make_rule("r2", 10, 8)]
        result = _make_eval(rules)
        path = tmp_path / "baseline.json"
        save_baseline(result, path)

        data = json.loads(path.read_text())
        assert data["run_id"] == "test-run"
        assert "r1" in data["rules"]
        assert data["rules"]["r1"]["pass_rate"] == 1.0
        assert data["rules"]["r2"]["pass_rate"] == pytest.approx(0.8)

    def test_overwrites_existing(self, tmp_path):
        path = tmp_path / "baseline.json"
        path.write_text('{"old": true}')
        result = _make_eval([_make_rule("r1", 5, 5)])
        save_baseline(result, path)
        data = json.loads(path.read_text())
        assert "old" not in data


# ── compute (drift) ───────────────────────────────────────────────────────────


class TestComputeDrift:
    def _write_baseline(self, tmp_path: Path, rules: dict) -> Path:
        path = tmp_path / "baseline.json"
        data = {"run_id": "base-run", "rules": rules}
        path.write_text(json.dumps(data))
        return path

    def test_stable_rule(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 1.0, "total_pairs": 10}})
        current = _make_eval([_make_rule("r1", 10, 10)])
        report = compute(current, path)
        assert report.entries[0].direction == "stable"
        assert report.entries[0].delta_pct == 0.0

    def test_degraded_rule(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 1.0, "total_pairs": 10}})
        current = _make_eval([_make_rule("r1", 10, 8)])   # dropped to 80%
        report = compute(current, path)
        entry = report.entries[0]
        assert entry.direction == "degraded"
        assert entry.delta_pct == pytest.approx(-20.0)

    def test_improved_rule(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 0.8, "total_pairs": 10}})
        current = _make_eval([_make_rule("r1", 10, 10)])  # back to 100%
        report = compute(current, path)
        entry = report.entries[0]
        assert entry.direction == "improved"
        assert entry.delta_pct == pytest.approx(20.0)

    def test_alert_triggered_when_delta_exceeds_threshold(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 1.0, "total_pairs": 10}})
        current = _make_eval([_make_rule("r1", 10, 9)])   # -10% drop
        report = compute(current, path, drift_threshold_pct=5.0)
        assert report.alert is True

    def test_no_alert_when_delta_within_threshold(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 1.0, "total_pairs": 10}})
        current = _make_eval([_make_rule("r1", 10, 10)])  # stable
        report = compute(current, path, drift_threshold_pct=5.0)
        assert report.alert is False

    def test_new_rule_not_in_baseline_is_stable(self, tmp_path):
        path = self._write_baseline(tmp_path, {})
        current = _make_eval([_make_rule("new-rule", 10, 9)])
        report = compute(current, path)
        assert report.entries[0].direction == "stable"
        assert report.entries[0].delta_pct == 0.0

    def test_overall_delta_is_mean(self, tmp_path):
        path = self._write_baseline(tmp_path, {
            "r1": {"pass_rate": 1.0, "total_pairs": 10},
            "r2": {"pass_rate": 1.0, "total_pairs": 10},
        })
        current = _make_eval([
            _make_rule("r1", 10, 8),   # -20%
            _make_rule("r2", 10, 10),  # 0%
        ])
        report = compute(current, path)
        assert report.overall_delta == pytest.approx(-10.0)

    def test_baseline_not_found_raises(self, tmp_path):
        current = _make_eval([_make_rule("r1", 10, 10)])
        with pytest.raises(BaselineNotFoundError):
            compute(current, tmp_path / "missing.json")

    def test_corrupt_baseline_raises(self, tmp_path):
        path = tmp_path / "baseline.json"
        path.write_text("not valid json {{{{")
        current = _make_eval([_make_rule("r1", 10, 10)])
        with pytest.raises(BaselineCorruptError):
            compute(current, path)

    def test_run_ids_in_report(self, tmp_path):
        path = self._write_baseline(tmp_path, {"r1": {"pass_rate": 1.0, "total_pairs": 5}})
        current = _make_eval([_make_rule("r1", 5, 5)])
        report = compute(current, path)
        assert report.baseline_run_id == "base-run"
        assert report.current_run_id == "test-run"
