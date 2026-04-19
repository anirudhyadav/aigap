"""Tests for GoldenPair, TestSuite, and dataset_loader."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from aigap.loaders.dataset_loader import DatasetLoadError, load
from aigap.models.dataset import GoldenPair
from aigap.models.dataset import TestSuite as _TestSuite


FIXTURE = Path(__file__).parent.parent / "fixtures" / "golden_dataset.jsonl"


# ── GoldenPair ────────────────────────────────────────────────────────────────


class TestGoldenPair:
    def _pair(self, **kw) -> GoldenPair:
        defaults = dict(id="p1", prompt="Hello", response="Hi there")
        return GoldenPair(**{**defaults, **kw})

    def test_basic(self):
        p = self._pair()
        assert p.id == "p1"
        assert p.tags == []
        assert p.expected_pass == {}

    def test_empty_prompt_raises(self):
        with pytest.raises(Exception, match="prompt must not be empty"):
            self._pair(prompt="   ")

    def test_empty_response_raises(self):
        with pytest.raises(Exception, match="response must not be empty"):
            self._pair(response="")

    def test_covers(self):
        p = self._pair(expected_pass={"no-pii-leakage": True, "cite-sources": False})
        assert p.covers("no-pii-leakage") is True
        assert p.covers("cite-sources") is True
        assert p.covers("english-only") is False

    def test_expected_verdict(self):
        p = self._pair(expected_pass={"no-pii-leakage": True, "cite-sources": False})
        assert p.expected_verdict("no-pii-leakage") is True
        assert p.expected_verdict("cite-sources") is False
        assert p.expected_verdict("english-only") is None


# ── TestSuite ─────────────────────────────────────────────────────────────────


class TestTestSuite:
    def _make_suite(self, n: int = 3) -> TestSuite:
        pairs = [
            GoldenPair(id=f"p{i}", prompt=f"Q{i}", response=f"A{i}")
            for i in range(n)
        ]
        return _TestSuite(pairs=pairs)

    def test_len(self):
        assert len(self._make_suite(5)) == 5

    def test_duplicate_ids_raises(self):
        pair = GoldenPair(id="dup", prompt="Q", response="A")
        with pytest.raises(Exception, match="Duplicate pair id"):
            _TestSuite(pairs=[pair, pair.model_copy()])

    def test_covering(self):
        pairs = [
            GoldenPair(id="p1", prompt="Q", response="A", expected_pass={"rule-a": True}),
            GoldenPair(id="p2", prompt="Q", response="A", expected_pass={"rule-b": False}),
            GoldenPair(id="p3", prompt="Q", response="A"),
        ]
        suite = _TestSuite(pairs=pairs)
        assert len(suite.covering("rule-a")) == 1
        assert suite.covering("rule-a")[0].id == "p1"
        assert len(suite.covering("rule-b")) == 1
        assert len(suite.covering("rule-c")) == 0

    def test_with_tag(self):
        pairs = [
            GoldenPair(id="p1", prompt="Q", response="A", tags=["pii", "guardrail"]),
            GoldenPair(id="p2", prompt="Q", response="A", tags=["citation"]),
        ]
        suite = _TestSuite(pairs=pairs)
        assert len(suite.with_tag("pii")) == 1
        assert len(suite.with_tag("citation")) == 1
        assert len(suite.with_tag("security")) == 0

    def test_pair_by_id(self):
        suite = self._make_suite(3)
        assert suite.pair_by_id("p0").id == "p0"
        with pytest.raises(KeyError):
            suite.pair_by_id("missing")


# ── dataset_loader.load() ─────────────────────────────────────────────────────


class TestDatasetLoader:
    def test_loads_jsonl_fixture(self):
        suite = load(FIXTURE)
        assert len(suite) == 8
        assert suite.source_path == str(FIXTURE)

    def test_expected_pass_populated(self):
        suite = load(FIXTURE)
        pair = suite.pair_by_id("pair-0001")
        assert pair.expected_verdict("cite-sources") is True
        assert pair.expected_verdict("no-pii-leakage") is True

    def test_auto_id_when_absent(self, tmp_path):
        p = tmp_path / "data.jsonl"
        p.write_text('{"prompt": "Hello", "response": "Hi"}\n')
        suite = load(p)
        assert suite.pairs[0].id == "pair-0001"

    def test_file_not_found_raises(self, tmp_path):
        with pytest.raises(DatasetLoadError, match="not found"):
            load(tmp_path / "missing.jsonl")

    def test_unsupported_format_raises(self, tmp_path):
        p = tmp_path / "data.csv"
        p.write_text("prompt,response\nhello,hi\n")
        with pytest.raises(DatasetLoadError, match="Unsupported dataset format"):
            load(p)

    def test_bad_json_raises(self, tmp_path):
        p = tmp_path / "data.jsonl"
        p.write_text('{"prompt": "Hello", "response": "Hi"}\n{bad json}\n')
        with pytest.raises(DatasetLoadError, match="JSON parse error"):
            load(p)

    def test_missing_prompt_raises(self, tmp_path):
        p = tmp_path / "data.jsonl"
        p.write_text('{"id": "p1", "response": "Hi"}\n')
        with pytest.raises(DatasetLoadError, match="missing required key 'prompt'"):
            load(p)

    def test_yaml_format(self, tmp_path):
        p = tmp_path / "data.yaml"
        p.write_text(
            "pairs:\n"
            "  - id: y1\n"
            "    prompt: Hello\n"
            "    response: Hi\n"
            "  - id: y2\n"
            "    prompt: Bye\n"
            "    response: Goodbye\n"
        )
        suite = load(p)
        assert len(suite) == 2
        assert suite.pair_by_id("y1").prompt == "Hello"

    def test_yaml_bare_list(self, tmp_path):
        p = tmp_path / "data.yaml"
        p.write_text(
            "- id: b1\n"
            "  prompt: Hello\n"
            "  response: Hi\n"
        )
        suite = load(p)
        assert len(suite) == 1

    def test_json_format(self, tmp_path):
        p = tmp_path / "data.json"
        data = [{"id": "j1", "prompt": "Q", "response": "A"}]
        p.write_text(json.dumps(data))
        suite = load(p)
        assert len(suite) == 1
        assert suite.pair_by_id("j1").response == "A"

    def test_duplicate_ids_raises(self, tmp_path):
        p = tmp_path / "data.jsonl"
        p.write_text(
            '{"id": "dup", "prompt": "Q", "response": "A"}\n'
            '{"id": "dup", "prompt": "Q2", "response": "A2"}\n'
        )
        with pytest.raises(DatasetLoadError, match="Duplicate"):
            load(p)
