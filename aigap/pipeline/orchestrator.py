"""
Orchestrator — wires Stage 1 → Stage 2 → Stage 3 together.

Usage:
    result = asyncio.run(run_pipeline(config, suite, client))

The orchestrator:
  1. Fans out Stage 1 (Haiku) across all (rule × pair) combos under a semaphore.
  2. Fans out Stage 2 (Sonnet) for every FAIL verdict — PASS/SKIP pairs skip it.
  3. Aggregates per-rule RuleResults.
  4. Calls Stage 3 (Opus) once with the compact summary.
  5. Returns a complete EvalResult.

An optional `on_event` callback receives progress events for SSE streaming.
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Callable

import anthropic

from aigap.config import DEFAULT_CONCURRENCY
from aigap.models.dataset import GoldenPair, TestSuite
from aigap.models.evaluation import (
    AnalysisResult,
    ClassifierResult,
    EfficacyScore,
    EvalResult,
    RuleResult,
    Verdict,
)
from aigap.models.policy import PolicyConfig, PolicyRule, PolicySuite
from aigap.pipeline.analyzer import analyze_failure
from aigap.pipeline.cache import ResultCache
from aigap.pipeline.classifier import classify_pair
from aigap.pipeline.synthesizer import synthesize
from aigap.scoring import coverage as coverage_mod
from aigap.scoring import efficacy as efficacy_mod


async def run_pipeline(
    suite_obj:   PolicySuite,
    dataset:     TestSuite,
    client:      anthropic.AsyncAnthropic,
    *,
    concurrency: int = DEFAULT_CONCURRENCY,
    cache:       ResultCache | None = None,
    on_event:    Callable[[dict], None] | None = None,
) -> EvalResult:
    """
    Run the full three-stage pipeline and return a complete EvalResult.

    Args:
        suite_obj:   PolicySuite with resolved plugins.
        dataset:     TestSuite of GoldenPairs to evaluate.
        client:      Async Anthropic client.
        concurrency: Max concurrent Haiku calls (semaphore).
        cache:       ResultCache instance (created if None).
        on_event:    Optional callback(event_dict) for live progress.
    """
    config = suite_obj.config
    cache  = cache or ResultCache()

    def emit(event: dict) -> None:
        if on_event:
            on_event(event)

    # ── Stage 1 — classify all (rule × pair) combinations ─────────────────
    emit({"type": "stage", "stage": 1, "total": len(config.rules) * len(dataset.pairs)})

    semaphore = asyncio.Semaphore(concurrency)

    async def _classify_guarded(rule: PolicyRule, pair: GoldenPair) -> ClassifierResult:
        # Check plugin fast_check first
        plugin = suite_obj.plugins.get(rule.id)
        if plugin:
            fc = plugin.fast_check(rule, pair)
            if fc is not None:
                result = ClassifierResult(
                    rule_id    = rule.id,
                    pair_id    = pair.id,
                    verdict    = Verdict.FAIL if not fc.verdict else Verdict.PASS,
                    confidence = fc.confidence,
                    rationale  = fc.rationale,
                    from_cache = False,
                    latency_ms = 0,
                )
                emit({"type": "classify", "rule_id": rule.id, "pair_id": pair.id,
                      "verdict": result.verdict.value, "source": "plugin"})
                return result

        async with semaphore:
            result = await classify_pair(rule, pair, client, cache)

        emit({"type": "classify", "rule_id": rule.id, "pair_id": pair.id,
              "verdict": result.verdict.value, "source": "llm"})
        return result

    tasks = [
        _classify_guarded(rule, pair)
        for rule in config.rules
        for pair in dataset.pairs
    ]
    classifier_results: list[ClassifierResult] = await asyncio.gather(*tasks)

    # ── Stage 2 — analyze failures ─────────────────────────────────────────
    fail_results = [r for r in classifier_results if r.verdict == Verdict.FAIL]
    emit({"type": "stage", "stage": 2, "total": len(fail_results)})

    rule_map  = {r.id: r for r in config.rules}
    pair_map  = {p.id: p for p in dataset.pairs}

    async def _analyze_guarded(cr: ClassifierResult) -> AnalysisResult:
        rule = rule_map[cr.rule_id]
        pair = pair_map[cr.pair_id]
        analysis = await analyze_failure(rule, pair, cr, client)
        emit({"type": "analyze", "rule_id": cr.rule_id, "pair_id": cr.pair_id,
              "root_cause": analysis.root_cause[:80]})
        return analysis

    analysis_tasks = [_analyze_guarded(cr) for cr in fail_results]
    analyses: list[AnalysisResult] = await asyncio.gather(*analysis_tasks)

    # ── Aggregate per-rule results ─────────────────────────────────────────
    rule_results = _aggregate(config, dataset, classifier_results, analyses)

    # ── Coverage + deterministic efficacy score ────────────────────────────
    cov_report = coverage_mod.compute(config, dataset)
    efficacy   = efficacy_mod.compute(rule_results, cov_report.coverage_score)

    # ── Stage 3 — synthesize + recommendations ─────────────────────────────
    emit({"type": "stage", "stage": 3, "total": 1})
    efficacy = await synthesize(config.name, efficacy, rule_results, client)
    emit({"type": "synthesize", "grade": efficacy.grade, "score": efficacy.overall_score})

    return EvalResult(
        policy_name  = config.name,
        rule_results = rule_results,
        efficacy     = efficacy,
        metadata     = {
            "coverage_score":  cov_report.coverage_score,
            "concurrency":     concurrency,
        },
    )


# ── Aggregation helper ────────────────────────────────────────────────────────

def _aggregate(
    config:      PolicyConfig,
    dataset:     TestSuite,
    classifiers: list[ClassifierResult],
    analyses:    list[AnalysisResult],
) -> list[RuleResult]:
    # Index analyses by (rule_id, pair_id)
    analysis_index: dict[tuple[str, str], AnalysisResult] = {
        (a.rule_id, a.pair_id): a for a in analyses
    }

    # Index classifier results by rule_id
    by_rule: dict[str, list[ClassifierResult]] = defaultdict(list)
    for cr in classifiers:
        by_rule[cr.rule_id].append(cr)

    pair_map = {p.id: p for p in dataset.pairs}
    results: list[RuleResult] = []

    for rule in config.rules:
        rule_classifiers = by_rule.get(rule.id, [])
        rule_analyses    = [analysis_index[(rule.id, cr.pair_id)]
                            for cr in rule_classifiers
                            if cr.verdict == Verdict.FAIL
                            and (rule.id, cr.pair_id) in analysis_index]

        passed  = sum(1 for cr in rule_classifiers if cr.verdict == Verdict.PASS)
        failed  = sum(1 for cr in rule_classifiers if cr.verdict == Verdict.FAIL)
        skipped = sum(1 for cr in rule_classifiers if cr.verdict == Verdict.SKIP)

        # FP: labelled should-pass but classified as FAIL
        fp = sum(
            1 for cr in rule_classifiers
            if cr.verdict == Verdict.FAIL
            and pair_map.get(cr.pair_id) is not None
            and pair_map[cr.pair_id].expected_verdict(rule.id) is True
        )
        # FN: labelled should-fail but classified as PASS
        fn = sum(
            1 for cr in rule_classifiers
            if cr.verdict == Verdict.PASS
            and pair_map.get(cr.pair_id) is not None
            and pair_map[cr.pair_id].expected_verdict(rule.id) is False
        )

        results.append(RuleResult(
            rule_id          = rule.id,
            rule_name        = rule.name,
            category         = rule.category.value,
            severity         = rule.severity.value,
            total_pairs      = len(rule_classifiers),
            passed           = passed,
            failed           = failed,
            skipped          = skipped,
            false_positives  = fp,
            false_negatives  = fn,
            analyses         = rule_analyses,
        ))

    return results
