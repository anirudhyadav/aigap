"""
Stage 1 — Classifier (Haiku)

For every (rule, pair) combination:
  1. Run the fast_patterns plugin short-circuit (no API call).
  2. Check the disk/memory cache.
  3. Call claude-haiku-4-5 with cache_control on the rule block.
  4. Parse and return a ClassifierResult.

All calls are async.  The orchestrator fans these out under a semaphore.
"""
from __future__ import annotations

import asyncio
import json
import time

import anthropic

from aigap.models.dataset import GoldenPair
from aigap.models.evaluation import ClassifierResult, Verdict
from aigap.models.policy import PolicyRule
from aigap.pipeline.cache import (
    ResultCache,
    build_classify_messages,
    pair_user_block,
    rule_system_block,
)

MODEL = "claude-haiku-4-5-20251001"


async def classify_pair(
    rule:   PolicyRule,
    pair:   GoldenPair,
    client: anthropic.AsyncAnthropic,
    cache:  ResultCache,
) -> ClassifierResult:
    """
    Classify a single (rule, pair) combination.

    Returns a ClassifierResult with verdict SKIP if a fast_pattern matched,
    a cached result if available, or a fresh Haiku classification otherwise.
    """
    # ── Fast-path: regex pre-filter ───────────────────────────────────────
    if rule.fast_patterns and rule.fast_match(pair.response):
        return ClassifierResult(
            rule_id    = rule.id,
            pair_id    = pair.id,
            verdict    = Verdict.FAIL,
            confidence = 1.0,
            rationale  = "Fast-pattern match — LLM call skipped.",
            from_cache = False,
            latency_ms = 0,
        )

    # ── Cache lookup ──────────────────────────────────────────────────────
    key = ResultCache.make_key(rule_id=rule.id, pair_id=pair.id, model=MODEL)
    cached = cache.get(key)
    if cached is not None:
        return cached

    # ── Haiku API call ────────────────────────────────────────────────────
    messages = build_classify_messages(
        rule_system_block(rule.id, rule.name, rule.description, rule.category.value, rule.severity.value),
        pair_user_block(pair.prompt, pair.response),
    )

    t0 = time.monotonic()
    try:
        response = await client.messages.create(
            model      = MODEL,
            max_tokens = 256,
            messages   = messages,
        )
        latency_ms = int((time.monotonic() - t0) * 1000)
        result = _parse_response(response, rule.id, pair.id, latency_ms)
    except anthropic.APIError as exc:
        latency_ms = int((time.monotonic() - t0) * 1000)
        result = ClassifierResult(
            rule_id    = rule.id,
            pair_id    = pair.id,
            verdict    = Verdict.ERROR,
            confidence = 0.0,
            rationale  = f"API error: {exc}",
            from_cache = False,
            latency_ms = latency_ms,
        )

    cache.set(key, result)
    return result


# ── Response parser ───────────────────────────────────────────────────────────

def _parse_response(
    response: anthropic.types.Message,
    rule_id:  str,
    pair_id:  str,
    latency_ms: int,
) -> ClassifierResult:
    raw_text = response.content[0].text.strip() if response.content else ""

    # Strip markdown fences if the model wrapped the JSON
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        return ClassifierResult(
            rule_id    = rule_id,
            pair_id    = pair_id,
            verdict    = Verdict.ERROR,
            confidence = 0.0,
            rationale  = f"Unparseable response: {raw_text[:120]}",
            from_cache = False,
            latency_ms = latency_ms,
        )

    raw_verdict = str(data.get("verdict", "")).lower()
    verdict = Verdict.PASS if raw_verdict == "pass" else (
              Verdict.FAIL if raw_verdict == "fail" else Verdict.ERROR)

    return ClassifierResult(
        rule_id    = rule_id,
        pair_id    = pair_id,
        verdict    = verdict,
        confidence = float(data.get("confidence", 0.8)),
        rationale  = str(data.get("rationale", ""))[:500],
        from_cache = False,
        latency_ms = latency_ms,
    )
