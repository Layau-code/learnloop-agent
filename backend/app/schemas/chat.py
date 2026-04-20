from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatThreadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    active_material_id: str | None
    active_topic: str | None
    status: str
    last_active_at: datetime
    created_at: datetime


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    thread_id: str
    role: str
    message_type: str
    content_md: str
    citations_json: list = Field(default_factory=list)
    retrieval_context_json: dict = Field(default_factory=dict)
    model_name: str | None
    created_at: datetime


class StudyQaAskRequest(BaseModel):
    material_id: str
    question: str
    thread_id: str | None = None


class StudyQaAskResponse(BaseModel):
    thread: ChatThreadRead
    user_message: ChatMessageRead
    assistant_message: ChatMessageRead
    workflow_run_id: str
