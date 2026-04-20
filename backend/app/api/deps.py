from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repos.settings import UserProfileRepository


def get_current_or_default_user_id(db: Session = Depends(get_db)) -> str:
    profiles = UserProfileRepository(db)
    profile = profiles.get_default_profile()
    if profile is None:
        profile = profiles.create(display_name="default")
    return profile.id
