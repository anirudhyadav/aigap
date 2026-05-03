from __future__ import annotations

import asyncio
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from aigap import __version__
from aigap.config import BASELINE_PATH, DEFAULT_REPORT_PREFIX

STATIC      = Path(__file__).parent / "static"
REPORT_JSON = Path(f"{DEFAULT_REPORT_PREFIX}.json")
REPORT_MD   = Path(f"{DEFAULT_REPORT_PREFIX}.md")

app = FastAPI(title="aigap", version=__version__)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": __version__}


@app.get("/report/latest")
async def report_latest() -> dict:
    if not REPORT_JSON.exists():
        return {}
    try:
        return json.loads(REPORT_JSON.read_text(encoding="utf-8"))
    except Exception:
        return {}


@app.get("/report/{run_id}/json")
async def report_json(run_id: str) -> FileResponse:
    path = Path(f"aigap-report-{run_id}.json")
    if not path.exists():
        path = REPORT_JSON
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path, media_type="application/json",
                        filename=f"aigap-{run_id}.json")


@app.get("/report/{run_id}/markdown")
async def report_markdown(run_id: str) -> FileResponse:
    path = Path(f"aigap-report-{run_id}.md")
    if not path.exists():
        path = REPORT_MD
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path, media_type="text/markdown",
                        filename=f"aigap-{run_id}.md")


@app.get("/baseline")
async def baseline_endpoint() -> dict:
    path = Path(BASELINE_PATH)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


@app.get("/history")
async def history() -> dict:
    """Return the last 5 pass-rates per rule from the latest report."""
    if not REPORT_JSON.exists():
        return {}
    try:
        data = json.loads(REPORT_JSON.read_text(encoding="utf-8"))
        rule_history: dict[str, list[float]] = {}
        for r in data.get("rule_results", []):
            rule_history[r["rule_id"]] = [r.get("pass_rate", 1.0)]
        return {"history": rule_history}
    except Exception:
        return {}


@app.get("/drift")
async def drift_endpoint() -> dict:
    """Return per-rule drift data comparing latest report to baseline."""
    baseline_path = Path(BASELINE_PATH)
    if not REPORT_JSON.exists():
        return {"drift": []}

    report = json.loads(REPORT_JSON.read_text(encoding="utf-8"))
    baseline = {}
    if baseline_path.exists():
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))

    baseline_rates = {}
    for r in baseline.get("rule_results", []):
        baseline_rates[r["rule_id"]] = r.get("pass_rate", 1.0)

    drift_entries = []
    for r in report.get("rule_results", []):
        rule_id = r["rule_id"]
        current_rate = r.get("pass_rate", 1.0)
        prev_rate = baseline_rates.get(rule_id)
        delta = (current_rate - prev_rate) if prev_rate is not None else None
        drift_entries.append({
            "rule_id": rule_id,
            "current_rate": current_rate,
            "baseline_rate": prev_rate,
            "delta": delta,
            "alert": delta is not None and delta < -0.05
        })

    return {"drift": drift_entries}


@app.get("/trends")
async def trends_endpoint() -> dict:
    """Return historical pass-rate trend data from stored reports."""
    import glob
    reports = sorted(glob.glob("aigap-report*.json"))
    if not reports:
        return {"trends": {}}

    trends: dict[str, list[dict]] = {}
    for report_path in reports[-10:]:
        try:
            data = json.loads(Path(report_path).read_text(encoding="utf-8"))
            run_id = data.get("run_id", report_path)
            timestamp = data.get("timestamp", "")
            for r in data.get("rule_results", []):
                rule_id = r["rule_id"]
                if rule_id not in trends:
                    trends[rule_id] = []
                trends[rule_id].append({
                    "run_id": run_id,
                    "timestamp": timestamp,
                    "pass_rate": r.get("pass_rate", 1.0)
                })
        except Exception:
            continue

    return {"trends": trends}


@app.get("/plugins")
async def plugins_endpoint() -> dict:
    """Return plugin results breakdown from the latest report."""
    if not REPORT_JSON.exists():
        return {"plugins": []}

    report = json.loads(REPORT_JSON.read_text(encoding="utf-8"))
    plugin_data = []
    for r in report.get("rule_results", []):
        plugin_name = r.get("plugin")
        if plugin_name:
            plugin_data.append({
                "rule_id": r["rule_id"],
                "plugin": plugin_name,
                "pass_rate": r.get("pass_rate", 1.0),
                "fast_path_hits": r.get("fast_path_hits", 0),
                "total_pairs": r.get("total_pairs", 0)
            })

    return {"plugins": plugin_data}


@app.get("/rules")
async def rules_endpoint(
    policy: str = Query(".aigap-policy.yaml", description="Path to policy YAML"),
) -> dict:
    policy_path = Path(policy)
    if not policy_path.exists():
        return {"rules": []}
    try:
        from aigap.loaders.policy_loader import load as load_policy
        config = load_policy(policy_path)
        return {"rules": [r.model_dump() for r in config.rules]}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/check")
async def check(
    policy:  str = Query(".aigap-policy.yaml"),
    dataset: str = Query("tests/golden_dataset.jsonl"),
) -> StreamingResponse:
    """Trigger a pipeline run and stream SSE events as it progresses."""
    from aigap.server.sse import SSEQueue
    from aigap.loaders.policy_loader import load as load_policy, PolicyLoadError
    from aigap.loaders.dataset_loader import load as load_dataset, DatasetLoadError
    from aigap.pipeline.orchestrator import run_pipeline
    from aigap.pipeline.cache import ResultCache
    from aigap.plugins.registry import build_suite
    from aigap.report.json_report import write as write_json
    from aigap.report.markdown import write as write_md
    import anthropic

    queue = SSEQueue()

    async def _run() -> None:
        try:
            config      = load_policy(policy)
            suite_data  = load_dataset(dataset)
            plugin_suite = build_suite(config)
            client       = anthropic.AsyncAnthropic()

            result = await run_pipeline(
                plugin_suite, suite_data, client,
                cache=ResultCache(),
                on_event=queue.put,
            )
            write_json(result, DEFAULT_REPORT_PREFIX)
            write_md(result, DEFAULT_REPORT_PREFIX)
            queue.put({"type": "complete", "run_id": result.run_id,
                       "grade": result.efficacy.grade,
                       "score": result.efficacy.overall_score})
        except (PolicyLoadError, DatasetLoadError) as exc:
            queue.put({"type": "error", "message": str(exc)})
        except Exception as exc:
            queue.put({"type": "error", "message": str(exc)})
        finally:
            queue.close()

    asyncio.create_task(_run())
    return StreamingResponse(queue.stream(), media_type="text/event-stream")
