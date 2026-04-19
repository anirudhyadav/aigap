"""
CompetitorMentionPlugin — detects named competitor references in responses.

Competitors are configured via PolicyRule.params:

    rules:
      - id: no-competitor-mention
        plugin: "aigap.plugins.builtins.competitor_mention:CompetitorMentionPlugin"
        params:
          competitors:
            - "Rival Corp"
            - "CompetitorX"
          # optional: also flag comparison language even without names
          flag_comparison_language: true

If no competitors list is supplied, the plugin falls through to Haiku so
the LLM can make a semantic judgment about contextual competitor mentions.

Comparison-language patterns (flagged when flag_comparison_language=true):
  - "better than", "cheaper than", "faster than" + competitor name
  - "unlike [competitor]", "compared to [competitor]"
  - Benchmark language: "beats", "outperforms", "lags behind"
"""
from __future__ import annotations

import re
from typing import Any

from aigap.models.dataset import GoldenPair
from aigap.models.policy import PolicyRule
from aigap.plugins.base import FastCheckResult, PolicyPlugin

_COMPARISON_LANGUAGE = re.compile(
    r"(?:better|cheaper|faster|slower|worse|more (?:expensive|affordable)|"
    r"outperform|beat|surpass|lag behind|unlike|compared to|in contrast to)\b",
    re.IGNORECASE,
)


class CompetitorMentionPlugin(PolicyPlugin):
    rule_id = "competitor_mention"

    def __init__(self, params: dict[str, Any] | None = None) -> None:
        super().__init__(params)
        raw: list[str] = self.params.get("competitors", [])
        self._flag_comparison: bool = self.params.get("flag_comparison_language", False)

        # Compile one combined pattern for all competitor names
        if raw:
            escaped = [re.escape(c) for c in raw]
            self._pattern: re.Pattern | None = re.compile(
                r"\b(?:" + "|".join(escaped) + r")\b",
                re.IGNORECASE,
            )
            self._names = raw
        else:
            self._pattern = None
            self._names = []

    def fast_check(self, rule: PolicyRule, pair: GoldenPair) -> FastCheckResult | None:
        response = pair.response

        # Also check fast_patterns from the rule config (compiled by PolicyRule.compile())
        if rule.fast_patterns and rule.fast_match(response):
            return FastCheckResult(
                verdict    = False,
                confidence = 0.95,
                rationale  = "Competitor name matched by rule fast_pattern",
                evidence   = _first_match(rule, response),
            )

        # Plugin-level competitor list
        if self._pattern:
            m = self._pattern.search(response)
            if m:
                extra = ""
                if self._flag_comparison and _COMPARISON_LANGUAGE.search(response):
                    extra = " with comparison language"
                return FastCheckResult(
                    verdict    = False,
                    confidence = 0.97,
                    rationale  = f"Competitor '{m.group(0)}' mentioned{extra}",
                    evidence   = m.group(0),
                )

        # No competitor list configured — defer to Haiku
        return None

    def on_failure(self, rule: PolicyRule, pair: GoldenPair) -> dict[str, Any]:
        hits = []
        if self._pattern:
            for m in self._pattern.finditer(pair.response):
                hits.append(m.group(0))
        return {"competitor_mentions": hits}


def _first_match(rule: PolicyRule, text: str) -> str:
    import re as _re
    for p in rule.fast_patterns:
        m = _re.search(p, text, _re.IGNORECASE)
        if m:
            return m.group(0)
    return ""
