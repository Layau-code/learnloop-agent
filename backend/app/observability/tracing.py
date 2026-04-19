from __future__ import annotations

import logging

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

logger = logging.getLogger("myagent.trace")


def configure_tracing() -> None:
    if not isinstance(trace.get_tracer_provider(), TracerProvider):
        trace.set_tracer_provider(TracerProvider())


def trace_event(name: str, payload: dict) -> None:
    logger.info("trace_event name=%s payload=%s", name, payload)

