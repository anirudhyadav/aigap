from __future__ import annotations

from pydantic import BaseModel

from aigap.models.evaluation import EvalResult


class DriftEntry(BaseModel):
    rule_id:            str
    previous_pass_rate: float
    current_pass_rate:  float
    delta_pct:          float    # current - previous, in percentage points
    direction:          str      # "improved" | "degraded" | "stable"


class DriftReport(BaseModel):
    baseline_run_id: str
    current_run_id:  str
    entries:         list[DriftEntry]
    overall_delta:   float       # mean delta across all rules
    alert:           bool        # True if any rule degraded beyond threshold


class RunReport(BaseModel):
    eval_result:  EvalResult
    drift:        DriftReport | None = None
    report_path:  str = ""
    exit_code:    int = 0        # 0 = all block_on rules pass, 1 = at least one fails
