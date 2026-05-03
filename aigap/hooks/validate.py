"""
Pre-commit hook: validate .aigap-policy.yaml structure.

Runs on every commit that touches the policy file.
Exit 0 = pass, exit 1 = validation error.
"""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    policy_path = Path(".aigap-policy.yaml")
    if not policy_path.exists():
        return 0

    try:
        from aigap.loaders.policy_loader import load
        config = load(policy_path)
        print(f"aigap: policy '{config.name}' validated — {len(config.rules)} rules, OK")
        return 0
    except Exception as exc:
        print(f"aigap: policy validation FAILED — {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
