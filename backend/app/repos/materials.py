from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import Material, MaterialChunk
from app.repos.base import BaseRepository


class MaterialRepository(BaseRepository[Material]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Material)


class MaterialChunkRepository(BaseRepository[MaterialChunk]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, MaterialChunk)

    def list_for_material(self, material_id: str) -> list[MaterialChunk]:
        return list(
            self.db.query(MaterialChunk)
            .filter(MaterialChunk.material_id == material_id)
            .order_by(MaterialChunk.chunk_index.asc())
        )
