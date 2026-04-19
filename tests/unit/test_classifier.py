"""Tests for scoring (coverage, efficacy) and pipeline cache."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from aigap.loaders.dataset_loader import load as load_dataset
from aigap.loaders.policy_loader import load as load_policy
from aigap.models.dataset import GoldenPair
from aigap.models.evaluation import ClassifierResult, EfficacyScore, RuleResult, Verdict
from aigap.models.policy import PolicyConfig, PolicyRule, RuleCategory, RuleSeverity
from aigap.pipeline.cache import (
    ResultCache,
    build_classify_messages,
    pair_user_block,
    rule_system_block,
)
from aigap.scoring import coverage as coverage_mod
from aigap.scoring import efficacy as efficacy_mod

POLICY_FIXTURE  = Path(__file__).parent.parent / "fixtures" / "sample_policy.yaml"
DATASET_FIXTURE = Path(__file__).parent.parent / "fixtures" / "golden_dataset.jsonl"


# ── Coverage scoring ──────────────────────────────────────────────────────────


class TestCoverageScoring:
    def setup_method(self):
        self.config = load_policy(POLICY_FIXTURE)
        self.suite  = load_dataset(DATASET_FIXTURE)

    def test_coverage_score_gt_zero(self):
        report = coverage_mod.compute(self.config, self.suite)
        assert report.coverage_score > 0

    def test_covered_rules_have_pairs(self):
        report = coverage_mod.compute(self.config, self.suite)
        for rc in report.covered_rules:
            assert rc.pair_count > 0

    def test_uncovered_rules_have_no_pairs(self):
        report = coverage_mod.compute(self.config, self.suite)
        for rc in report.uncovered_rules:
            assert rc.pair_count == 0

    def test_positives_plus_negatives_equals_pair_count(self):
        report = coverage_mod.compute(self.config, self.suite)
        for rc in report.rule_coverages:
            assert rc.positive_count + rc.negative_count == rc.pair_count

    def test_total_count_equals_rule_count(self):
        report = coverage_mod.compute(self.config, self.suite)
        assert report.total_count == len(self.config.rules)

    def test_empty_suite_gives_zero_coverage(self):
        from aigap.models.dataset import TestSuite as _TestSuite
        empty_suite = _TestSuite(pairs=[])
        report = coverage_mod.compute(self.config, empty_suite)
        assert report.coverage_score == 0.0
        assert report.covered_count == 0

    def test_full_coverage(self):
        """When every rule has at least one pair, score should be 100."""
        from aigap.models.dataset import TestSuite as _TestSuite
        rules = self.config.rules
        pairs = [
            GoldenPair(
                id=f"pair-{r.id}",
                prompt="Q",
                response="A",
                expected_pass={r.id: True},
            )
            for r in rules
        ]
        suite = _TestSuite(pairs=pairs)
        report = coverage_mod.compute(self.config, suite)
        assert report.coverage_score == 100.0
        assert report.covered_count == len(rules)


# ── Efficacy scoring ──────────────────────────────────────────────────────────


def _make_rule_result(rule_id: str, total: int, passed: int, fp: int = 0, fn: int = 0) -> RuleResult:
    return RuleResult(
        rule_id=rule_id, rule_name=rule_id, category="policy", severity="medium",
        total_pairs=total, passed=passed, failed=total - passed,
        skipped=0, false_positives=fp, false_negatives=fn,
    )


class TestEfficacyScoring:
    def test_perfect_score(self):
        rules = [_make_rule_result("r1", 10, 10), _make_rule_result("r2", 10, 10)]
        score = efficacy_mod.compute(rules, coverage_score=100.0)
        assert score.overall_score > 90
        assert score.grade == "A"

    def test_empty_rules_gives_f(self):
        score = efficacy_mod.compute([], coverage_score=0.0)
        assert score.grade == "F"
        assert score.overall_score == 0.0

    def test_high_fnr_reduces_score(self):
        # Many false negatives should drag the score down
        rules_good = [_make_rule_result("r1", 100, 100, fn=0)]
        rules_bad  = [_make_rule_result("r2", 100, 60,  fn=30)]
        score_good = efficacy_mod.compute(rules_good, coverage_score=100.0)
        score_bad  = efficacy_mod.compute(rules_bad,  coverage_score=100.0)
        assert score_good.overall_score > score_bad.overall_score

    def test_low_coverage_reduces_score(self):
        rules = [_make_rule_result("r1", 10, 10)]
        score_full = efficacy_mod.compute(rules, coverage_score=100.0)
        score_low  = efficacy_mod.compute(rules, coverage_score=20.0)
        assert score_full.overall_score > score_low.overall_score

    def test_grade_thresholds(self):
        assert efficacy_mod.score_to_grade(95) == "A"
        assert efficacy_mod.score_to_grade(80) == "B"
        assert efficacy_mod.score_to_grade(65) == "C"
        assert efficacy_mod.score_to_grade(50) == "D"
        assert efficacy_mod.score_to_grade(30) == "F"

    def test_strength_labels(self):
        assert efficacy_mod._strength_label(0.0)  == "strong"
        assert efficacy_mod._strength_label(2.0)  == "moderate"
        assert efficacy_mod._strength_label(10.0) == "weak"
        assert efficacy_mod._strength_label(20.0) == "absent"

    def test_top_risks_worst_first(self):
        rules = [
            _make_rule_result("low-fail",  10, 9),   # 10% failure
            _make_rule_result("high-fail", 10, 5),   # 50% failure
            _make_rule_result("mid-fail",  10, 7),   # 30% failure
        ]
        score = efficacy_mod.compute(rules, coverage_score=100.0)
        assert "high-fail" in score.top_risks[0]

    def test_score_bounded(self):
        rules = [_make_rule_result("r", 10, 10)]
        score = efficacy_mod.compute(rules, coverage_score=100.0)
        assert 0.0 <= score.overall_score <= 100.0


# ── Pipeline cache ────────────────────────────────────────────────────────────


class TestResultCache:
    def test_miss_returns_none(self, tmp_path):
        cache = ResultCache(tmp_path)
        assert cache.get("nonexistent-key") is None

    def test_set_then_get_memory(self, tmp_path):
        cache = ResultCache(tmp_path)
        result = ClassifierResult(
            rule_id="r1", pair_id="p1", verdict=Verdict.PASS,
            confidence=0.9, rationale="Looks good", from_cache=False, latency_ms=120,
        )
        key = ResultCache.make_key("r1", "p1", "haiku")
        cache.set(key, result)
        cached = cache.get(key)
        assert cached is not None
        assert cached.verdict == Verdict.PASS
        assert cached.from_cache is True

    def test_persists_to_disk(self, tmp_path):
        key = ResultCache.make_key("r1", "p1", "haiku")
        result = ClassifierResult(
            rule_id="r1", pair_id="p1", verdict=Verdict.FAIL,
            confidence=0.95, rationale="Bad", from_cache=False, latency_ms=200,
        )
        cache1 = ResultCache(tmp_path)
        cache1.set(key, result)

        # New cache instance (cold memory)
        cache2 = ResultCache(tmp_path)
        loaded = cache2.get(key)
        assert loaded is not None
        assert loaded.verdict == Verdict.FAIL
        assert loaded.from_cache is True

    def test_disabled_cache_always_misses(self, tmp_path):
        cache = ResultCache(tmp_path, disabled=True)
        result = ClassifierResult(
            rule_id="r1", pair_id="p1", verdict=Verdict.PASS,
            confidence=0.9, rationale="ok", from_cache=False, latency_ms=0,
        )
        key = ResultCache.make_key("r1", "p1", "haiku")
        cache.set(key, result)
        assert cache.get(key) is None

    def test_clear_memory(self, tmp_path):
        cache = ResultCache(tmp_path)
        key = ResultCache.make_key("r1", "p1", "haiku")
        result = ClassifierResult(
            rule_id="r1", pair_id="p1", verdict=Verdict.PASS,
            confidence=0.9, rationale="ok", from_cache=False, latency_ms=0,
        )
        cache.set(key, result)
        cache.clear_memory()
        # Should still hit disk
        loaded = cache.get(key)
        assert loaded is not None

    def test_stable_key_for_same_inputs(self):
        k1 = ResultCache.make_key("no-pii", "pair-001", "haiku")
        k2 = ResultCache.make_key("no-pii", "pair-001", "haiku")
        assert k1 == k2

    def test_different_models_give_different_keys(self):
        k1 = ResultCache.make_key("no-pii", "pair-001", "haiku")
        k2 = ResultCache.make_key("no-pii", "pair-001", "sonnet")
        assert k1 != k2


# ── Cache message builders ────────────────────────────────────────────────────


class TestMessageBuilders:
    def test_classify_messages_structure(self):
        msgs = build_classify_messages("SYSTEM BLOCK", "USER BLOCK")
        assert len(msgs) == 1
        assert msgs[0]["role"] == "user"
        content = msgs[0]["content"]
        assert len(content) == 2
        # First block has cache_control
        assert content[0]["cache_control"] == {"type": "ephemeral"}
        assert content[0]["text"] == "SYSTEM BLOCK"
        # Second block has no cache_control
        assert "cache_control" not in content[1]
        assert content[1]["text"] == "USER BLOCK"

    def test_rule_system_block_contains_rule_fields(self):
        block = rule_system_block("no-pii", "No PII", "Desc", "guardrail", "critical")
        assert "no-pii" in block
        assert "No PII" in block
        assert "guardrail" in block
        assert "critical" in block

    def test_pair_user_block_contains_prompt_and_response(self):
        block = pair_user_block("Hello?", "Hi there!")
        assert "Hello?" in block
        assert "Hi there!" in block
