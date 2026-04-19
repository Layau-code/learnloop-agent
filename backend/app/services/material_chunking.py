from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ChunkPayload:
    chunk_index: int
    heading_path: str | None
    content: str
    token_count: int
    metadata_json: dict


class MaterialChunkingService:
    def chunk(self, normalized_text: str, chunk_size: int = 800) -> list[ChunkPayload]:
        if not normalized_text:
            return []

        paragraphs = [part.strip() for part in normalized_text.split("\n\n") if part.strip()]
        if not paragraphs:
            paragraphs = [normalized_text]

        chunks: list[ChunkPayload] = []
        buffer = ""
        chunk_index = 0

        for paragraph in paragraphs:
            candidate = f"{buffer}\n\n{paragraph}".strip() if buffer else paragraph
            if len(candidate) <= chunk_size:
                buffer = candidate
                continue

            if buffer:
                chunks.append(self._build_chunk(chunk_index, buffer))
                chunk_index += 1

            if len(paragraph) <= chunk_size:
                buffer = paragraph
                continue

            for start in range(0, len(paragraph), chunk_size):
                part = paragraph[start : start + chunk_size].strip()
                if part:
                    chunks.append(self._build_chunk(chunk_index, part))
                    chunk_index += 1
            buffer = ""

        if buffer:
            chunks.append(self._build_chunk(chunk_index, buffer))

        logger.info("material_chunking_completed chunk_count=%s", len(chunks))
        return chunks

    def _build_chunk(self, chunk_index: int, content: str) -> ChunkPayload:
        token_count = max(1, len(content.split()))
        return ChunkPayload(
            chunk_index=chunk_index,
            heading_path=None,
            content=content,
            token_count=token_count,
            metadata_json={"char_length": len(content)},
        )

