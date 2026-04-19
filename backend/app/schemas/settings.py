from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    display_name: str
    learning_goals: list
    preferred_topics: list
    writing_style_profile: dict
    answer_style_profile: dict
    locale: str
    timezone: str
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    display_name: str | None = None
    learning_goals: list | None = None
    preferred_topics: list | None = None
    writing_style_profile: dict | None = None
    answer_style_profile: dict | None = None
    locale: str | None = None
    timezone: str | None = None

