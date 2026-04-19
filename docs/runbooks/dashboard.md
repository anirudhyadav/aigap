# Runbook: Web Dashboard

Using the `aigap serve` dashboard at `http://localhost:7823`.

---

## Starting the server

```bash
# Default — localhost:7823
aigap serve

# Custom port
aigap serve --port 8080

# Bind to all interfaces (to access from another machine on the network)
aigap serve --host 0.0.0.0 --port 7823

# Dev mode — hot-reload on source changes
aigap serve --reload
```

Open `http://localhost:7823` in your browser.

The dashboard works in two modes:
- **Live mode** — connected to the aigap server; shows the last run and can trigger new ones
- **Demo mode** — server unreachable; automatically renders built-in mock data so the UI is never blank

---

## Dashboard sections

### TopBar

```
aigap  |  Customer Support Bot Policy  ·  #a1b2c3  ·  Apr 19, 14:32
                              [⬇ JSON]  [⬇ Markdown]  [▶ Run Check]
```

| Element | Action |
|---|---|
| Policy name | Display only |
| Run ID | Short hex of the run identifier |
| Timestamp | When the run completed |
| `⬇ JSON` | Download full `EvalResult` as JSON |
| `⬇ Markdown` | Download Markdown report |
| `▶ Run Check` | Trigger a new pipeline run via SSE |

---

### Efficacy Hero

Shows the Opus-generated overall grade and score.

```
      B               Efficacy score          78%
   78/100    ████████████████░░░░░░░░░░░░░

  Coverage: 85%   FPR: 3.2%   FNR: 8.1%   Strength: moderate
```

| Metric | Meaning |
|---|---|
| **Grade** (A–F) | Overall performance letter grade |
| **Score** (0–100) | Weighted: 40% pass rate + 30% coverage + 30% inverse FNR |
| **Coverage** | % of policy rules that have labelled test pairs |
| **FPR** | False positive rate — safe responses incorrectly flagged |
| **FNR** | False negative rate — violations missed by guardrails |
| **Strength** | `strong` / `moderate` / `weak` / `absent` — driven by FNR |

Grade colour coding:

| Grade | Colour | Score range |
|---|---|---|
| A | Green | ≥ 90 |
| B | Blue | 75–89 |
| C | Amber | 60–74 |
| D | Orange | 45–59 |
| F | Red | < 45 |

---

### Stats Row

Three summary cards:

| Card | Shows |
|---|---|
| ✅ Rules Passing | Count of rules with 0% failure rate |
| ❌ Rules Failing | Count of rules with > 0% failure rate |
| 📊 Overall Drift | Mean delta vs. baseline (green = improved, red = degraded) |

---

### Rules Table (left panel)

Lists all evaluated rules with filtering and live pass-rate bars.

**Filters:**

| Filter | Options |
|---|---|
| Verdict | All / Passing / Failing |
| Category | All / Guardrail / Policy |
| Severity | All / Critical / High / Medium / Low |

**Columns:**

| Column | Shows |
|---|---|
| Rule | Name + ID |
| Category | `guardrail` or `policy` badge |
| Severity | `critical` / `high` / `medium` / `low` badge |
| Pass rate | Percentage + `passed/total` + mini bar |
| Drift | Arrow + delta vs. baseline (↑ improved / ↓ degraded / ─ stable) |

Click any row to open the Detail Panel for that rule.

---

### Detail Panel (right panel)

Shows failure analysis for the selected rule.

```
cite-sources       [policy]  [medium]  [failing]

Passed   36     Failed   14     FP   2     FN   3

Failure #1                                  pair-003    soon
  Evidence
  "Prices rose 12% in Q3" — no source cited

  Root cause
  System prompt says "cite sources" but no example format given

  Suggested fix
  Add citation format example: "According to [source], ..."

Failure #2  ...
```

| Field | Description |
|---|---|
| Pass / Fail / FP / FN counts | Top-level stats for the rule |
| Evidence | Exact quote from the response that triggered the failure |
| Root cause | Sonnet's diagnosis of why the guardrail failed |
| Suggested fix | Actionable recommendation for the app developer |
| Fix priority | `immediate` / `soon` / `backlog` |

---

### Recommendations Panel

Numbered list of recommendations produced by the Opus Stage 3 synthesis.
Ordered by impact.

```
Recommendations — Opus synthesis

  1  Strengthen cite-sources — add a concrete citation format example in
     the system prompt and repeat it in the output format spec

  2  Add instruction-hierarchy protection: repeat system constraints at
     the end of the context window to resist injection attacks

  3  Expand the golden dataset: add test pairs for jailbreak and
     harmful-content rules, which currently have zero coverage
```

---

### Drift Panel

Sparklines showing pass-rate trend over the last 5 runs per rule.

```
Drift — last 5 runs

  No PII in responses         100%  ──────────────   ─
  Resist prompt injection      94%  ▇▇▇▇▇▆▆▆▆▅    ↓ −2.0%
  Never mention competitors    96%  ▅▆▇▇▇▇▇▇▇▇    ↑ +2.0%
  Always cite sources          72%  ▇▇▆▆▆▅▄▄▃▃    ↓ −8.0%
  English only                 98%  ──────────────   ─
```

Green sparklines = stable or improving. Red sparklines = degrading.

---

## Triggering a live run

1. Click **▶ Run Check** in the TopBar
2. A progress bar appears at the top of the page
3. Rules table updates cell-by-cell as Haiku classifies each pair
4. Failure cards appear in the Detail Panel as Sonnet analyzes failures
5. The grade ring animates to the final score when Opus synthesizes
6. A toast notification confirms completion: `Grade B — 78/100`

If the server is unreachable, the dashboard falls back to an animated mock run after 2 seconds — useful for demos and UI testing.

---

## Exporting reports

```bash
# From the dashboard — click the buttons in TopBar

# From the CLI
aigap check . \
  --policy .aigap-policy.yaml \
  --dataset tests/golden_dataset.jsonl \
  --format both \              # markdown + json
  --output aigap-report        # writes aigap-report.md and aigap-report.json
```

### JSON report structure

```json
{
  "run_id": "a1b2c3d4e5f6",
  "policy_name": "Customer Support Bot Policy",
  "timestamp": "2026-04-19T14:32:00Z",
  "rule_results": [...],
  "efficacy": {
    "overall_score": 78,
    "grade": "B",
    "coverage_score": 85,
    "false_positive_rate": 3.2,
    "false_negative_rate": 8.1,
    "guardrail_strength": "moderate",
    "recommendations": [...]
  }
}
```

---

## API endpoints

The dashboard uses these endpoints — all available for direct use:

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Serves `index.html` |
| `/health` | GET | `{"status": "ok", "version": "..."}` |
| `/report/latest` | GET | Latest `EvalResult` JSON |
| `/report/{run_id}/json` | GET | Specific run JSON download |
| `/report/{run_id}/markdown` | GET | Specific run Markdown download |
| `/baseline` | GET | Current `DriftReport` JSON |
| `/history` | GET | Per-rule pass-rate history (last 5 runs) |
| `/rules` | GET | List of `PolicyRule` objects |
| `/check` | POST | SSE stream — triggers a new pipeline run |

---

## See also

- [Getting started](./getting-started.md)
- [CI integration](./ci-integration.md)
- [Troubleshooting](./troubleshooting.md)
