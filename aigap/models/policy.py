from __future__ import annotations

import re
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class RuleCategory(str, Enum):
    GUARDRAIL = "guardrail"
    POLICY    = "policy"


_SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


class RuleSeverity(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"

    def __lt__(self, other: "RuleSeverity") -> bool:
        return _SEVERITY_ORDER[self.value] < _SEVERITY_ORDER[other.value]

    def __le__(self, other: "RuleSeverity") -> bool:
        return _SEVERITY_ORDER[self.value] <= _SEVERITY_ORDER[other.value]


class PolicyRule(BaseModel):
    id: str
    name: str
    description: str
    category: RuleCategory
    severity: RuleSeverity = RuleSeverity.HIGH

    # Optional fully-qualified plugin class e.g. "aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin"
    plugin: str | None = None

    # Arbitrary params forwarded to the plugin constructor
    params: dict[str, Any] = Field(default_factory=dict)

    # Regex fast-path patterns compiled at validation time.
    # If any pattern matches the response text the rule is flagged before LLM eval.
    fast_patterns: list[str] = Field(default_factory=list)

    # Tags that must appear on GoldenPairs for this rule to count as "covered"
    required_test_tags: list[str] = Field(default_factory=list)

    # Compiled regex objects (excluded from serialisation)
    _compiled: list[re.Pattern] = []

    @field_validator("id")
    @classmethod
    def id_slug(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", v):
            raise ValueError(
                f"Rule id '{v}' must be lowercase alphanumeric with hyphens (e.g. 'no-pii-leakage')"
            )
        return v

    @field_validator("fast_patterns")
    @classmethod
    def validate_patterns(cls, patterns: list[str]) -> list[str]:
        for p in patterns:
            try:
                re.compile(p)
            except re.error as exc:
                raise ValueError(f"Invalid regex pattern '{p}': {exc}") from exc
        return patterns

    def compile(self) -> None:
        """Pre-compile regex patterns for fast-path matching."""
        self._compiled = [re.compile(p) for p in self.fast_patterns]

    def fast_match(self, text: str) -> bool:
        """Return True if any fast_pattern matches text. Compiles lazily."""
        if not self._compiled:
            self.compile()
        return any(rx.search(text) for rx in self._compiled)

    model_config = {"use_enum_values": False}


class PolicyConfig(BaseModel):
    version: str = "1"
    name: str
    rules: list[PolicyRule]

    # Severities that cause `aigap check` to exit non-zero
    block_on: list[RuleSeverity] = Field(
        default_factory=lambda: [RuleSeverity.CRITICAL, RuleSeverity.HIGH]
    )

    # Percentage drop in any rule's pass-rate that triggers a drift alert
    drift_threshold_pct: float = 5.0

    @field_validator("rules")
    @classmethod
    def no_duplicate_ids(cls, rules: list[PolicyRule]) -> list[PolicyRule]:
        seen: set[str] = set()
        for r in rules:
            if r.id in seen:
                raise ValueError(f"Duplicate rule id: '{r.id}'")
            seen.add(r.id)
        return rules

    @field_validator("drift_threshold_pct")
    @classmethod
    def positive_threshold(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("drift_threshold_pct must be > 0")
        return v

    @model_validator(mode="after")
    def compile_patterns(self) -> "PolicyConfig":
        for rule in self.rules:
            rule.compile()
        return self

    # ── Helpers ──────────────────────────────────────────────────────────

    def rule_by_id(self, rule_id: str) -> PolicyRule:
        for r in self.rules:
            if r.id == rule_id:
                return r
        raise KeyError(f"No rule with id '{rule_id}'")

    def rules_at_severity(self, *severities: RuleSeverity) -> list[PolicyRule]:
        return [r for r in self.rules if r.severity in severities]

    def should_block(self, severity: RuleSeverity) -> bool:
        return severity in self.block_on

    model_config = {"use_enum_values": False}


class PolicySuite(BaseModel):
    """
    Runtime object that pairs a PolicyConfig with resolved plugin instances.
    Plugins are populated by the PluginRegistry after loading the config.
    """

    config: PolicyConfig
    # Maps rule_id → instantiated plugin object (or None if no plugin declared)
    plugins: dict[str, Any] = Field(default_factory=dict)

    model_config = {"arbitrary_types_allowed": True}
