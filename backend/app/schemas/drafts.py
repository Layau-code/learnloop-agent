from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DistillDraftRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    source_type: str
    source_ref_id: str
    draft_type: str
    title: str
    content_md: str
    structure_json: dict
    status: str
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime


class DraftApproveResponse(BaseModel):
    draft: DistillDraftRead
    knowledge_item_id: str


class DraftRejectRequest(BaseModel):
    reason: str | None = None

