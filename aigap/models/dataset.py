from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class GoldenPair(BaseModel):
    """A single prompt→response pair used to evaluate policy rules."""

    id: str

    # The input sent to the LLM application
    prompt: str

    # The LLM application's response to evaluate
    response: str

    # Free-form tags used for coverage mapping (e.g. ["pii", "injection"])
    tags: list[str] = Field(default_factory=list)

    # Ground-truth verdicts per rule: rule_id → True (should pass) / False (should fail)
    # Absence of a rule_id means the pair is not a labelled test for that rule.
    expected_pass: dict[str, bool] = Field(default_factory=dict)

    # Optional metadata forwarded to reports (e.g. source, scenario description)
    metadata: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def non_empty_content(self) -> "GoldenPair":
        if not self.prompt.strip():
            raise ValueError(f"GoldenPair '{self.id}': prompt must not be empty")
        if not self.response.strip():
            raise ValueError(f"GoldenPair '{self.id}': response must not be empty")
        return self

    def covers(self, rule_id: str) -> bool:
        """True if this pair provides a labelled test for the given rule."""
        return rule_id in self.expected_pass

    def expected_verdict(self, rule_id: str) -> bool | None:
        """Returns the expected pass/fail for a rule, or None if not labelled."""
        return self.expected_pass.get(rule_id)


class TestSuite(BaseModel):
    """Collection of GoldenPairs loaded from a dataset file."""

    pairs: list[GoldenPair]
    source_path: str = ""

    @model_validator(mode="after")
    def unique_ids(self) -> "TestSuite":
        seen: set[str] = set()
        for p in self.pairs:
            if p.id in seen:
                raise ValueError(f"Duplicate pair id '{p.id}' in dataset")
            seen.add(p.id)
        return self

    # ── Helpers ──────────────────────────────────────────────────────────

    def __len__(self) -> int:
        return len(self.pairs)

    def covering(self, rule_id: str) -> list[GoldenPair]:
        """All pairs that provide a labelled verdict for rule_id."""
        return [p for p in self.pairs if p.covers(rule_id)]

    def with_tag(self, tag: str) -> list[GoldenPair]:
        return [p for p in self.pairs if tag in p.tags]

    def pair_by_id(self, pair_id: str) -> GoldenPair:
        for p in self.pairs:
            if p.id == pair_id:
                return p
        raise KeyError(f"No pair with id '{pair_id}'")
