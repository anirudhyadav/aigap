from __future__ import annotations

import os

CLASSIFIER_MODEL  = os.getenv("AIGAP_CLASSIFIER_MODEL",  "claude-haiku-4-5-20251001")
ANALYZER_MODEL    = os.getenv("AIGAP_ANALYZER_MODEL",    "claude-sonnet-4-6")
SYNTHESIZER_MODEL = os.getenv("AIGAP_SYNTHESIZER_MODEL", "claude-opus-4-7")

DEFAULT_CONCURRENCY   = int(os.getenv("AIGAP_CONCURRENCY",   "10"))
CACHE_DIR             = os.getenv("AIGAP_CACHE_DIR",          ".aigap_cache")
BASELINE_PATH         = os.getenv("AIGAP_BASELINE_PATH",      "aigap-baseline.json")
DEFAULT_REPORT_PREFIX = os.getenv("AIGAP_REPORT_PREFIX",      "aigap-report")
DASHBOARD_PORT        = int(os.getenv("AIGAP_DASHBOARD_PORT", "7823"))
DASHBOARD_HOST        = os.getenv("AIGAP_DASHBOARD_HOST",     "127.0.0.1")
DEFAULT_FAIL_ON       = os.getenv("AIGAP_FAIL_ON",            "high")
