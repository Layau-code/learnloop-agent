from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repos.settings import UserProfileRepository
from app.schemas.settings import UserProfileRead, UserProfileUpdate

router = APIRouter()


@router.get("/profile", response_model=UserProfileRead)
def get_profile(db: Session = Depends(get_db)) -> UserProfileRead:
    repo = UserProfileRepository(db)
    profile = repo.get_default_profile()
    if profile is None:
        profile = repo.create(display_name="default")
    return UserProfileRead.model_validate(profile)


@router.patch("/profile", response_model=UserProfileRead)
def update_profile(payload: UserProfileUpdate, db: Session = Depends(get_db)) -> UserProfileRead:
    repo = UserProfileRepository(db)
    profile = repo.get_default_profile()
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    profile = repo.save(profile)
    return UserProfileRead.model_validate(profile)

