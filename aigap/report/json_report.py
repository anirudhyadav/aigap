"""JSON report generator — writes an EvalResult to a .json file."""
from __future__ import annotations

import json
from pathlib import Path

from aigap.models.evaluation import EvalResult
from aigap.models.report import DriftReport


def write(
    result:      EvalResult,
    path:        str | Path,
    drift:       DriftReport | None = None,
) -> Path:
    """
    Serialise result (and optional drift) to a JSON file.

    Args:
        result: The completed EvalResult.
        path:   Output path — `.json` extension is added if absent.
        drift:  Optional DriftReport to embed under "drift" key.

    Returns the resolved Path that was written.
    """
    path = Path(path)
    if path.suffix != ".json":
        path = path.with_suffix(".json")

    payload = result.model_dump()
    if drift is not None:
        payload["drift"] = drift.model_dump()

    path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    return path


def load(path: str | Path) -> EvalResult:
    """Load a previously written JSON report back to an EvalResult."""
    path = Path(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    data.pop("drift", None)   # not part of EvalResult schema
    return EvalResult(**data)
