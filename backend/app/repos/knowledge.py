from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.entities import KnowledgeItem, KnowledgeLink
from app.repos.base import BaseRepository


class KnowledgeRepository(BaseRepository[KnowledgeItem]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, KnowledgeItem)

    def list_visible(self, query: str | None = None, limit: int = 100) -> list[KnowledgeItem]:
        statement = self.db.query(KnowledgeItem).filter(KnowledgeItem.is_archived.is_(False))
        if query:
            like = f"%{query.strip()}%"
            statement = statement.filter(
                or_(
                    KnowledgeItem.title.ilike(like),
                    KnowledgeItem.topic.ilike(like),
                    KnowledgeItem.summary.ilike(like),
                    KnowledgeItem.content_md.ilike(like),
                )
            )
        return list(statement.order_by(KnowledgeItem.updated_at.desc()).limit(limit))


class KnowledgeLinkRepository(BaseRepository[KnowledgeLink]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, KnowledgeLink)
