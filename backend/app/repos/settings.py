from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import UserProfile
from app.repos.base import BaseRepository


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, UserProfile)

    def get_default_profile(self) -> UserProfile | None:
        return self.db.query(UserProfile).order_by(UserProfile.created_at.asc()).first()

