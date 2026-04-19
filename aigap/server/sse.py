"""
SSE (Server-Sent Events) helpers for the dashboard /check endpoint.

The orchestrator emits plain dicts via its on_event callback; this module
formats them as SSE text frames and manages the async queue that bridges
the orchestrator coroutine to the FastAPI streaming response.
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator


def format_event(event: dict, event_type: str | None = None) -> str:
    """Format a dict as an SSE frame string."""
    data  = json.dumps(event)
    frame = f"data: {data}\n"
    if event_type:
        frame = f"event: {event_type}\n" + frame
    return frame + "\n"


class SSEQueue:
    """
    Thread-safe bridge between a synchronous on_event callback and an
    async SSE generator.  The orchestrator calls put_sync() from the
    asyncio event loop; the FastAPI response consumes via __aiter__.
    """

    def __init__(self) -> None:
        self._queue: asyncio.Queue[dict | None] = asyncio.Queue()

    def put(self, event: dict) -> None:
        """Called from within the asyncio event loop (on_event callback)."""
        self._queue.put_nowait(event)

    def close(self) -> None:
        """Signal end-of-stream."""
        self._queue.put_nowait(None)

    async def stream(self) -> AsyncGenerator[str, None]:
        """Yield SSE frames until the queue is closed."""
        while True:
            event = await self._queue.get()
            if event is None:
                yield format_event({"type": "done"})
                break
            yield format_event(event, event_type=event.get("type"))
