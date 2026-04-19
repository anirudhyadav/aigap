"""Tests for policy model and policy_loader."""
from __future__ import annotations

import textwrap
from pathlib import Path

import pytest
import yaml

from aigap.loaders.policy_loader import PolicyLoadError, load
from aigap.models.policy import PolicyConfig, PolicyRule, RuleCategory, RuleSeverity


FIXTURE = Path(__file__).parent.parent / "fixtures" / "sample_policy.yaml"


# ── PolicyRule ────────────────────────────────────────────────────────────────


class TestPolicyRule:
    def test_basic_construction(self):
        rule = PolicyRule(
            id="no-pii-leakage",
            name="No PII",
            description="No PII allowed",
            category=RuleCategory.GUARDRAIL,
            severity=RuleSeverity.CRITICAL,
        )
        assert rule.id == "no-pii-leakage"
        assert rule.category == RuleCategory.GUARDRAIL
        assert rule.severity == RuleSeverity.CRITICAL
        assert rule.fast_patterns == []
        assert rule.plugin is None

    def test_invalid_id_raises(self):
        with pytest.raises(Exception):
            PolicyRule(
                id="No PII Leakage",  # spaces and uppercase not allowed
                name="Bad id",
                description="...",
                category=RuleCategory.GUARDRAIL,
                severity=RuleSeverity.HIGH,
            )

    def test_invalid_regex_raises(self):
        with pytest.raises(Exception):
            PolicyRule(
                id="bad-regex",
                name="Bad regex",
                description="...",
                category=RuleCategory.POLICY,
                severity=RuleSeverity.LOW,
                fast_patterns=["[unclosed"],
            )

    def test_fast_match_hit(self):
        rule = PolicyRule(
            id="no-competitor",
            name="No competitor",
            description="...",
            category=RuleCategory.POLICY,
            severity=RuleSeverity.HIGH,
            fast_patterns=["(?i)competitor_a"],
        )
        assert rule.fast_match("We are better than Competitor_A in every way.") is True

    def test_fast_match_miss(self):
        rule = PolicyRule(
            id="no-competitor",
            name="No competitor",
            description="...",
            category=RuleCategory.POLICY,
            severity=RuleSeverity.HIGH,
            fast_patterns=["(?i)competitor_a"],
        )
        assert rule.fast_match("Our product stands on its own merits.") is False

    def test_severity_ordering(self):
        assert RuleSeverity.CRITICAL < RuleSeverity.HIGH
        assert RuleSeverity.HIGH < RuleSeverity.MEDIUM
        assert RuleSeverity.MEDIUM < RuleSeverity.LOW
        assert RuleSeverity.CRITICAL <= RuleSeverity.CRITICAL


# ── PolicyConfig ──────────────────────────────────────────────────────────────


class TestPolicyConfig:
    def _make_rule(self, rule_id: str = "my-rule") -> PolicyRule:
        return PolicyRule(
            id=rule_id,
            name="Rule",
            description="...",
            category=RuleCategory.POLICY,
            severity=RuleSeverity.MEDIUM,
        )

    def test_duplicate_rule_ids_raises(self):
        rule = self._make_rule("duplicate")
        with pytest.raises(Exception, match="Duplicate rule id"):
            PolicyConfig(name="Policy", rules=[rule, rule.model_copy()])

    def test_zero_drift_threshold_raises(self):
        with pytest.raises(Exception):
            PolicyConfig(name="Policy", rules=[self._make_rule()], drift_threshold_pct=0)

    def test_rule_by_id(self):
        rule = self._make_rule("test-rule")
        config = PolicyConfig(name="Policy", rules=[rule])
        assert config.rule_by_id("test-rule") is rule

    def test_rule_by_id_missing_raises(self):
        config = PolicyConfig(name="Policy", rules=[self._make_rule()])
        with pytest.raises(KeyError):
            config.rule_by_id("does-not-exist")

    def test_should_block(self):
        config = PolicyConfig(
            name="Policy",
            rules=[self._make_rule()],
            block_on=[RuleSeverity.CRITICAL, RuleSeverity.HIGH],
        )
        assert config.should_block(RuleSeverity.CRITICAL) is True
        assert config.should_block(RuleSeverity.HIGH) is True
        assert config.should_block(RuleSeverity.MEDIUM) is False
        assert config.should_block(RuleSeverity.LOW) is False

    def test_rules_at_severity(self):
        rules = [
            self._make_rule("r1"),
            PolicyRule(id="r2", name="R2", description="...", category=RuleCategory.GUARDRAIL, severity=RuleSeverity.CRITICAL),
        ]
        config = PolicyConfig(name="Policy", rules=rules)
        critical = config.rules_at_severity(RuleSeverity.CRITICAL)
        assert len(critical) == 1
        assert critical[0].id == "r2"


# ── policy_loader.load() ──────────────────────────────────────────────────────


class TestPolicyLoader:
    def test_loads_fixture(self):
        config = load(FIXTURE)
        assert config.name == "Test Policy"
        assert len(config.rules) == 4
        assert config.drift_threshold_pct == 5.0

    def test_rule_fields_populated(self):
        config = load(FIXTURE)
        pii = config.rule_by_id("no-pii-leakage")
        assert pii.category == RuleCategory.GUARDRAIL
        assert pii.severity == RuleSeverity.CRITICAL
        assert pii.plugin == "aigap.plugins.builtins.pii_leakage"
        assert len(pii.fast_patterns) == 2

    def test_fast_patterns_compiled(self):
        config = load(FIXTURE)
        competitor_rule = config.rule_by_id("no-competitor-mention")
        assert competitor_rule.fast_match("Our product beats Competitor_A easily.") is True
        assert competitor_rule.fast_match("We are the best on the market.") is False

    def test_file_not_found_raises(self, tmp_path):
        with pytest.raises(PolicyLoadError, match="not found"):
            load(tmp_path / "nonexistent.yaml")

    def test_empty_rules_raises(self, tmp_path):
        p = tmp_path / "policy.yaml"
        p.write_text("name: Empty\nrules: []\n")
        with pytest.raises(PolicyLoadError, match="empty"):
            load(p)

    def test_missing_name_raises(self, tmp_path):
        p = tmp_path / "policy.yaml"
        p.write_text("rules:\n  - id: r1\n    name: R\n    description: D\n    category: policy\n    severity: low\n")
        with pytest.raises(PolicyLoadError, match="missing required key 'name'"):
            load(p)

    def test_duplicate_rule_ids_raises(self, tmp_path):
        content = textwrap.dedent("""
            name: Dup
            rules:
              - id: same-id
                name: Rule A
                description: desc
                category: policy
                severity: low
              - id: same-id
                name: Rule B
                description: desc
                category: guardrail
                severity: high
        """)
        p = tmp_path / "policy.yaml"
        p.write_text(content)
        with pytest.raises(PolicyLoadError, match="Duplicate"):
            load(p)

    def test_invalid_severity_raises(self, tmp_path):
        content = textwrap.dedent("""
            name: Bad
            rules:
              - id: my-rule
                name: Rule
                description: desc
                category: policy
                severity: extreme
        """)
        p = tmp_path / "policy.yaml"
        p.write_text(content)
        with pytest.raises(PolicyLoadError):
            load(p)

    def test_invalid_block_on_raises(self, tmp_path):
        content = textwrap.dedent("""
            name: Bad
            block_on: [critical, mega]
            rules:
              - id: my-rule
                name: Rule
                description: desc
                category: policy
                severity: high
        """)
        p = tmp_path / "policy.yaml"
        p.write_text(content)
        with pytest.raises(PolicyLoadError, match="Unknown severity"):
            load(p)

    def test_bad_yaml_raises(self, tmp_path):
        p = tmp_path / "policy.yaml"
        p.write_text("name: Bad\nrules:\n  - [unclosed bracket\n")
        with pytest.raises(PolicyLoadError, match="YAML parse error"):
            load(p)

    def test_rule_missing_required_field_raises(self, tmp_path):
        content = textwrap.dedent("""
            name: Missing
            rules:
              - id: incomplete-rule
                name: Rule
                category: policy
        """)
        p = tmp_path / "policy.yaml"
        p.write_text(content)
        with pytest.raises(PolicyLoadError, match="description"):
            load(p)
