"""
PolicyPlugin — base class for all guardrail and policy rule plugins.

Plugins sit in front of the LLM chain as a fast-path pre-filter.
Implement fast_check() to short-circuit the Haiku call when the verdict
is obvious (regex match, keyword hit, etc.).  Return None to fall through
to the Haiku classifier for anything ambiguous.

Registration
────────────
Built-ins register automatically via pyproject.toml entry points:

    [project.entry-points."aigap.plugins"]
    pii_leakage = "aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin"

Third-party plugins follow the same pattern in their own package.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from aigap.models.dataset import GoldenPair
from aigap.models.policy import PolicyRule


@dataclass
class FastCheckResult:
    """Returned by a plugin when a verdict can be determined without an LLM call."""

    verdict:    bool    # True = PASS, False = FAIL
    confidence: float   # 0.0–1.0
    rationale:  str     # one-line human-readable explanation
    evidence:   str = ""  # exact text fragment that triggered the verdict


class PolicyPlugin(ABC):
    """
    Abstract base for aigap plugins.

    Subclass this, override rule_id, then implement fast_check().
    Optionally override on_failure() to attach extra metadata to reports.
    """

    # Must match the identifier used in PolicyRule.plugin.
    # e.g. plugin: "aigap.plugins.builtins.pii_leakage:PiiLeakagePlugin"
    rule_id: str = ""

    def __init__(self, params: dict[str, Any] | None = None) -> None:
        self.params: dict[str, Any] = params or {}

    @abstractmethod
    def fast_check(self, rule: PolicyRule, pair: GoldenPair) -> FastCheckResult | None:
        """
        Evaluate the pair without an LLM call.

        Return a FastCheckResult when the verdict is certain.
        Return None to defer to the Haiku classifier.
        """

    def on_failure(self, rule: PolicyRule, pair: GoldenPair) -> dict[str, Any]:
        """
        Called after a confirmed failure (from fast_check or LLM).
        Return extra metadata to merge into the AnalysisResult.
        """
        return {}

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(rule_id={self.rule_id!r})"
