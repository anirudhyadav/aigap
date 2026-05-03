from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from aigap.models.policy import PolicyConfig, PolicyRule, RuleCategory, RuleSeverity


class PolicyLoadError(Exception):
    """Raised when the policy YAML is missing, malformed, or invalid."""


def load(path: str | Path) -> PolicyConfig:
    """
    Parse a .aigap-policy.yaml file and return a validated PolicyConfig.

    Raises PolicyLoadError on any file, parse, or validation problem so
    callers never need to handle yaml.YAMLError or pydantic.ValidationError directly.
    """
    path = Path(path)

    raw = _read_yaml(path)
    _check_required_keys(raw, path)
    config = _build_config(raw, path)
    return config


# ── Internal helpers ──────────────────────────────────────────────────────────


def _read_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise PolicyLoadError(f"Policy file not found: {path}")
    if not path.is_file():
        raise PolicyLoadError(f"Policy path is not a file: {path}")

    try:
        with path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
    except yaml.YAMLError as exc:
        raise PolicyLoadError(f"YAML parse error in {path}: {exc}") from exc

    if not isinstance(data, dict):
        raise PolicyLoadError(f"Policy file must be a YAML mapping, got {type(data).__name__}: {path}")

    return data


def _check_required_keys(data: dict, path: Path) -> None:
    for key in ("name", "rules"):
        if key not in data:
            raise PolicyLoadError(f"Policy file missing required key '{key}': {path}")

    if not isinstance(data["rules"], list):
        raise PolicyLoadError(f"'rules' must be a list: {path}")

    if len(data["rules"]) == 0:
        raise PolicyLoadError(f"'rules' list is empty — add at least one rule: {path}")


def _build_config(data: dict, path: Path) -> PolicyConfig:
    rules = [_build_rule(r, i, path) for i, r in enumerate(data["rules"])]

    try:
        config = PolicyConfig(
            version=str(data.get("version", "1")),
            name=data["name"],
            rules=rules,
            block_on=_parse_severities(data.get("block_on", ["critical", "high"]), path),
            drift_threshold_pct=float(data.get("drift_threshold_pct", 5.0)),
        )
    except ValidationError as exc:
        raise PolicyLoadError(f"Policy validation failed in {path}:\n{_fmt_validation(exc)}") from exc

    return config


def _build_rule(raw: Any, index: int, path: Path) -> PolicyRule:
    if not isinstance(raw, dict):
        raise PolicyLoadError(f"Rule at index {index} must be a mapping: {path}")

    for key in ("id", "name", "description", "category", "severity"):
        if key not in raw:
            raise PolicyLoadError(
                f"Rule at index {index} missing required key '{key}': {path}"
            )

    try:
        return PolicyRule(
            id=raw["id"],
            name=raw["name"],
            description=raw["description"],
            category=RuleCategory(raw["category"]),
            severity=RuleSeverity(raw["severity"]),
            plugin=raw.get("plugin"),
            params=raw.get("params", {}),
            fast_patterns=raw.get("fast_patterns", []),
            required_test_tags=raw.get("required_test_tags", []),
        )
    except (ValueError, ValidationError) as exc:
        raise PolicyLoadError(
            f"Invalid rule '{raw.get('id', f'index-{index}')}' in {path}: {exc}"
        ) from exc


def _parse_severities(raw: list, path: Path) -> list[RuleSeverity]:
    result = []
    for item in raw:
        try:
            result.append(RuleSeverity(str(item).lower()))
        except ValueError:
            valid = [s.value for s in RuleSeverity]
            raise PolicyLoadError(
                f"Unknown severity '{item}' in block_on. Valid values: {valid}: {path}"
            )
    return result


def _fmt_validation(exc: ValidationError) -> str:
    lines = []
    for err in exc.errors():
        loc = " → ".join(str(part) for part in err["loc"])
        lines.append(f"  {loc}: {err['msg']}")
    return "\n".join(lines)
