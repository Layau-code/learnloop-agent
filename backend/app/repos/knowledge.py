from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import KnowledgeItem
from app.repos.base import BaseRepository


class KnowledgeRepository(BaseRepository[KnowledgeItem]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, KnowledgeItem)

