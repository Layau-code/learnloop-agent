from __future__ import annotations

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.entities import ChatMessage, ChatThread
from app.repos.base import BaseRepository


class ChatThreadRepository(BaseRepository[ChatThread]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ChatThread)

    def get_for_user(self, thread_id: str, user_id: str) -> ChatThread | None:
        return (
            self.db.query(ChatThread)
            .filter(ChatThread.id == thread_id, ChatThread.user_id == user_id)
            .one_or_none()
        )

    def list_for_user(self, user_id: str, limit: int = 20) -> list[ChatThread]:
        return list(
            self.db.query(ChatThread)
            .filter(ChatThread.user_id == user_id)
            .order_by(desc(ChatThread.last_active_at))
            .limit(limit)
        )

    def list_for_material(self, user_id: str, material_id: str, limit: int = 20) -> list[ChatThread]:
        return list(
            self.db.query(ChatThread)
            .filter(ChatThread.user_id == user_id, ChatThread.active_material_id == material_id)
            .order_by(desc(ChatThread.last_active_at))
            .limit(limit)
        )


class ChatMessageRepository(BaseRepository[ChatMessage]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ChatMessage)

    def list_for_thread(self, thread_id: str, limit: int = 200) -> list[ChatMessage]:
        return list(
            self.db.query(ChatMessage)
            .filter(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
