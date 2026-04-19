from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from aigap.models.dataset import GoldenPair, TestSuite


class DatasetLoadError(Exception):
    """Raised when the dataset file is missing, malformed, or invalid."""


def load(path: str | Path) -> TestSuite:
    """
    Load a golden dataset from a JSONL or YAML file and return a TestSuite.

    JSONL — one JSON object per line:
        {"id": "pair-001", "prompt": "...", "response": "...", "expected_pass": {...}}

    YAML — list of mappings under a top-level "pairs" key or a bare list:
        pairs:
          - id: pair-001
            prompt: "..."
            response: "..."

    Raises DatasetLoadError on any file, parse, or validation problem.
    """
    path = Path(path)

    if not path.exists():
        raise DatasetLoadError(f"Dataset file not found: {path}")
    if not path.is_file():
        raise DatasetLoadError(f"Dataset path is not a file: {path}")

    suffix = path.suffix.lower()

    if suffix == ".jsonl":
        raw_pairs = _load_jsonl(path)
    elif suffix in (".yaml", ".yml"):
        raw_pairs = _load_yaml(path)
    elif suffix == ".json":
        raw_pairs = _load_json(path)
    else:
        raise DatasetLoadError(
            f"Unsupported dataset format '{suffix}'. Use .jsonl, .yaml, or .json: {path}"
        )

    pairs = _build_pairs(raw_pairs, path)

    try:
        return TestSuite(pairs=pairs, source_path=str(path))
    except ValidationError as exc:
        raise DatasetLoadError(f"Dataset validation failed in {path}: {exc}") from exc


# ── Format parsers ────────────────────────────────────────────────────────────


def _load_jsonl(path: Path) -> list[dict]:
    pairs: list[dict] = []
    with path.open(encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, start=1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise DatasetLoadError(
                    f"JSON parse error on line {line_no} of {path}: {exc}"
                ) from exc
            if not isinstance(obj, dict):
                raise DatasetLoadError(
                    f"Expected JSON object on line {line_no} of {path}, got {type(obj).__name__}"
                )
            pairs.append(obj)

    if not pairs:
        raise DatasetLoadError(f"Dataset file is empty: {path}")
    return pairs


def _load_yaml(path: Path) -> list[dict]:
    try:
        with path.open(encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
    except yaml.YAMLError as exc:
        raise DatasetLoadError(f"YAML parse error in {path}: {exc}") from exc

    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "pairs" in data:
        return data["pairs"]
    raise DatasetLoadError(
        f"YAML dataset must be a list or a mapping with a 'pairs' key: {path}"
    )


def _load_json(path: Path) -> list[dict]:
    try:
        with path.open(encoding="utf-8") as fh:
            data = json.load(fh)
    except json.JSONDecodeError as exc:
        raise DatasetLoadError(f"JSON parse error in {path}: {exc}") from exc

    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "pairs" in data:
        return data["pairs"]
    raise DatasetLoadError(
        f"JSON dataset must be a list or a mapping with a 'pairs' key: {path}"
    )


# ── Pair builder ──────────────────────────────────────────────────────────────


def _build_pairs(raw_pairs: list[Any], path: Path) -> list[GoldenPair]:
    pairs: list[GoldenPair] = []
    for i, raw in enumerate(raw_pairs):
        if not isinstance(raw, dict):
            raise DatasetLoadError(
                f"Pair at index {i} must be a mapping, got {type(raw).__name__}: {path}"
            )
        # Auto-generate an id if omitted (friendlier for hand-written datasets)
        if "id" not in raw:
            raw = {**raw, "id": f"pair-{i + 1:04d}"}

        for key in ("prompt", "response"):
            if key not in raw:
                raise DatasetLoadError(
                    f"Pair '{raw.get('id', i)}' missing required key '{key}': {path}"
                )
        try:
            pairs.append(GoldenPair(**raw))
        except (ValidationError, TypeError) as exc:
            raise DatasetLoadError(
                f"Invalid pair '{raw.get('id', i)}' in {path}: {exc}"
            ) from exc

    return pairs
