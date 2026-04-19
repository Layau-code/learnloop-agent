from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter

from openai import OpenAI

from app.core.config import settings
from app.observability.tracing import trace_event


@dataclass
class ModelResponse:
    content: str
    model_name: str
    latency_ms: int


class ModelAdapter:
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def is_enabled(self) -> bool:
        return self._client is not None

    def generate_text(self, prompt: str, model_name: str | None = None) -> ModelResponse:
        selected_model = model_name or settings.openai_chat_model
        if self._client is None:
            return ModelResponse(
                content="ModelAdapter is not configured. Add OPENAI_API_KEY to enable generation.",
                model_name=selected_model,
                latency_ms=0,
            )

        start = perf_counter()
        response = self._client.responses.create(model=selected_model, input=prompt)
        latency_ms = int((perf_counter() - start) * 1000)
        trace_event(
            "model.call",
            {
                "model_name": selected_model,
                "latency_ms": latency_ms,
            },
        )
        return ModelResponse(
            content=response.output_text,
            model_name=selected_model,
            latency_ms=latency_ms,
        )

    def embed_texts(self, texts: list[str], model_name: str | None = None) -> list[list[float] | None]:
        selected_model = model_name or settings.openai_embedding_model
        if self._client is None:
            return [None for _ in texts]

        start = perf_counter()
        response = self._client.embeddings.create(model=selected_model, input=texts)
        latency_ms = int((perf_counter() - start) * 1000)
        trace_event(
            "model.embedding",
            {
                "model_name": selected_model,
                "latency_ms": latency_ms,
                "input_count": len(texts),
            },
        )
        return [item.embedding for item in response.data]

