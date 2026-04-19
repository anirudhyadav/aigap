from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    PASS  = "pass"
    FAIL  = "fail"
    SKIP  = "skip"   # fast_pattern short-circuited before LLM
    ERROR = "error"  # LLM call failed


class ClassifierResult(BaseModel):
    """Output of Stage 1 (Haiku) — one verdict per (rule, pair)."""

    rule_id:    str
    pair_id:    str
    verdict:    Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    rationale:  str
    from_cache: bool = False
    latency_ms: int  = 0


class AnalysisResult(BaseModel):
    """Output of Stage 2 (Sonnet) — deep failure analysis for a single FAIL."""

    rule_id:        str
    pair_id:        str
    failure_reason: str
    root_cause:     str
    suggested_fix:  str
    evidence:       str       # exact quote from prompt/response that triggered failure
    fix_priority:   str       # "immediate" | "soon" | "backlog"


class RuleResult(BaseModel):
    """Aggregated per-rule result across all pairs after both pipeline stages."""

    rule_id:      str
    rule_name:    str
    category:     str
    severity:     str
    total_pairs:  int
    passed:       int
    failed:       int
    skipped:      int
    false_positives: int   # expected pass, classified fail
    false_negatives: int   # expected fail, classified pass
    analyses:     list[AnalysisResult] = Field(default_factory=list)

    @property
    def failure_rate(self) -> float:
        if self.total_pairs == 0:
            return 0.0
        return self.failed / self.total_pairs

    @property
    def pass_rate(self) -> float:
        return 1.0 - self.failure_rate


class EfficacyScore(BaseModel):
    """Output of Stage 3 (Opus) — one score object per run."""

    overall_score:        float = Field(ge=0.0, le=100.0)
    grade:                str              # A | B | C | D | F
    coverage_score:       float = Field(ge=0.0, le=100.0)
    false_positive_rate:  float = Field(ge=0.0)
    false_negative_rate:  float = Field(ge=0.0)
    guardrail_strength:   str              # "strong" | "moderate" | "weak" | "absent"
    top_risks:            list[str] = Field(default_factory=list)
    recommendations:      list[str] = Field(default_factory=list)
    confidence:           float = Field(ge=0.0, le=1.0, default=1.0)


class EvalResult(BaseModel):
    """Complete output for one aigap run."""

    run_id:       str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    policy_name:  str
    timestamp:    str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    rule_results: list[RuleResult]
    efficacy:     EfficacyScore
    metadata:     dict = Field(default_factory=dict)

    def rule_by_id(self, rule_id: str) -> RuleResult:
        for r in self.rule_results:
            if r.rule_id == rule_id:
                return r
        raise KeyError(rule_id)

    def failing_rules(self) -> list[RuleResult]:
        return [r for r in self.rule_results if r.failed > 0]
