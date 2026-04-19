from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import Material
from app.repos.base import BaseRepository


class MaterialRepository(BaseRepository[Material]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Material)

