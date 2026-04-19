"""
Coverage scoring: which policy rules have labelled test pairs in the test suite?

A rule is "covered" when at least one GoldenPair has the rule's id in its
expected_pass dict.  Coverage score = covered_rules / total_rules * 100.
"""
from __future__ import annotations

from dataclasses import dataclass

from aigap.models.dataset import TestSuite
from aigap.models.policy import PolicyConfig


@dataclass(frozen=True)
class RuleCoverage:
    rule_id:       str
    rule_name:     str
    covered:       bool
    pair_count:    int        # number of pairs that exercise this rule
    positive_count: int       # pairs where expected_pass[rule_id] is True
    negative_count: int       # pairs where expected_pass[rule_id] is False


@dataclass(frozen=True)
class CoverageReport:
    rule_coverages:  list[RuleCoverage]
    covered_count:   int
    total_count:     int
    coverage_score:  float    # 0–100

    @property
    def uncovered_rules(self) -> list[RuleCoverage]:
        return [r for r in self.rule_coverages if not r.covered]

    @property
    def covered_rules(self) -> list[RuleCoverage]:
        return [r for r in self.rule_coverages if r.covered]


def compute(config: PolicyConfig, suite: TestSuite) -> CoverageReport:
    """
    Compute per-rule coverage from a PolicyConfig and a TestSuite.

    Returns a CoverageReport with one RuleCoverage entry per rule.
    """
    coverages: list[RuleCoverage] = []

    for rule in config.rules:
        covering_pairs = suite.covering(rule.id)
        positives = sum(1 for p in covering_pairs if p.expected_pass.get(rule.id) is True)
        negatives = sum(1 for p in covering_pairs if p.expected_pass.get(rule.id) is False)

        coverages.append(RuleCoverage(
            rule_id        = rule.id,
            rule_name      = rule.name,
            covered        = len(covering_pairs) > 0,
            pair_count     = len(covering_pairs),
            positive_count = positives,
            negative_count = negatives,
        ))

    covered_count = sum(1 for c in coverages if c.covered)
    total         = len(coverages)
    score         = (covered_count / total * 100.0) if total > 0 else 0.0

    return CoverageReport(
        rule_coverages = coverages,
        covered_count  = covered_count,
        total_count    = total,
        coverage_score = round(score, 1),
    )
