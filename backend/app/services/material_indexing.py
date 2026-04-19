from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.entities import MaterialChunk
from app.repos.materials import MaterialChunkRepository
from app.services.material_chunking import ChunkPayload
from app.services.model_adapter import ModelAdapter

logger = logging.getLogger(__name__)


class MaterialIndexingService:
    def __init__(self, db: Session, model_adapter: ModelAdapter) -> None:
        self.db = db
        self.model_adapter = model_adapter
        self.chunks = MaterialChunkRepository(db)

    def replace_chunks(self, material_id: str, chunks: list[ChunkPayload]) -> list[MaterialChunk]:
        self.db.query(MaterialChunk).filter(MaterialChunk.material_id == material_id).delete()
        self.db.commit()

        embeddings = self.model_adapter.embed_texts([chunk.content for chunk in chunks]) if chunks else []
        saved_chunks: list[MaterialChunk] = []

        for index, chunk in enumerate(chunks):
            embedding = embeddings[index] if index < len(embeddings) else None
            saved_chunks.append(
                self.chunks.create(
                    material_id=material_id,
                    chunk_index=chunk.chunk_index,
                    heading_path=chunk.heading_path,
                    content=chunk.content,
                    token_count=chunk.token_count,
                    embedding=embedding,
                    metadata_json=chunk.metadata_json,
                )
            )

        logger.info("material_indexing_completed material_id=%s chunk_count=%s", material_id, len(saved_chunks))
        return saved_chunks

