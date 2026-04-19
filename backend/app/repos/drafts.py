from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import DistillDraft
from app.repos.base import BaseRepository


class DistillDraftRepository(BaseRepository[DistillDraft]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, DistillDraft)

    def list_for_source(self, source_type: str, source_ref_id: str) -> list[DistillDraft]:
        return list(
            self.db.query(DistillDraft)
            .filter(DistillDraft.source_type == source_type, DistillDraft.source_ref_id == source_ref_id)
            .order_by(DistillDraft.created_at.asc())
        )

