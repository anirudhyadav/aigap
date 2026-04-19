from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from aigap import __version__

STATIC = Path(__file__).parent / "static"

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
    # TODO: load last saved EvalResult from disk
    return {}


@app.get("/report/{run_id}/json")
async def report_json(run_id: str):
    # TODO: stream JSON report file
    return {}


@app.get("/report/{run_id}/markdown")
async def report_markdown(run_id: str):
    # TODO: stream Markdown report file
    return {}


@app.get("/baseline")
async def baseline() -> dict:
    # TODO: load aigap-baseline.json
    return {}


@app.get("/history")
async def history() -> dict:
    # TODO: return per-rule pass-rate history (last 5 runs)
    return {}


@app.post("/check")
async def check() -> StreamingResponse:
    # TODO: wire to orchestrator.run_pipeline(), stream SSE events
    async def _stream():
        yield "data: {}\n\n"

    return StreamingResponse(_stream(), media_type="text/event-stream")
