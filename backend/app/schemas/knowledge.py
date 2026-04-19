from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class KnowledgeItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    item_type: str
    topic: str | None
    summary: str | None
    content_md: str
    tags: list
    source_scope: str
    mastery_score: float | None
    confidence_score: float | None
    review_due_at: datetime | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
