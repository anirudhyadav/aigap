"""
Pre-push hook: run aigap check against the golden dataset.

Only triggers on pre-push (not pre-commit) since it makes API calls.
Exit 0 = pass, exit 1 = blocking violations found.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path


def main() -> int:
    policy_path = Path(".aigap-policy.yaml")
    dataset_path = Path("tests/golden_dataset.jsonl")

    if not policy_path.exists():
        print("aigap: no .aigap-policy.yaml found, skipping check")
        return 0

    if not dataset_path.exists():
        print("aigap: no golden dataset found, skipping check")
        return 0

    try:
        from aigap.loaders.policy_loader import load as load_policy
        from aigap.loaders.dataset_loader import load as load_dataset
        from aigap.pipeline.orchestrator import run_pipeline
        from aigap.pipeline.cache import ResultCache
        from aigap.plugins.registry import build_suite
        import anthropic

        config = load_policy(policy_path)
        suite_data = load_dataset(dataset_path)
        plugin_suite = build_suite(config)
        client = anthropic.AsyncAnthropic()

        result = asyncio.run(run_pipeline(
            plugin_suite, suite_data, client,
            cache=ResultCache()
        ))

        blocking = [
            r for r in result.rule_results
            if config.should_block(r.rule.severity) and r.pass_rate < 1.0
        ]

        if blocking:
            print(f"aigap: {len(blocking)} blocking rule(s) failed:")
            for r in blocking:
                print(f"  - {r.rule.id}: {r.pass_rate:.0%} pass rate ({r.rule.severity.value})")
            return 1

        print(f"aigap: all rules pass — grade {result.efficacy.grade} ({result.efficacy.overall_score:.1f}%)")
        return 0

    except Exception as exc:
        print(f"aigap: check hook error — {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
