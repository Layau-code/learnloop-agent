from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import ChatMessage, ChatThread
from app.repos.base import BaseRepository


class ChatThreadRepository(BaseRepository[ChatThread]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ChatThread)


class ChatMessageRepository(BaseRepository[ChatMessage]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ChatMessage)

