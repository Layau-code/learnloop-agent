from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MaterialCreate(BaseModel):
    title: str
    source_type: Literal["file", "url", "note"] = Field(description="file | url | note")
    source_uri: str | None = None
    mime_type: str | None = None
    raw_text: str | None = None
    topic_hint: str | None = None


class MaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    source_type: str
    source_uri: str | None
    mime_type: str | None
    raw_text: str | None
    normalized_text: str | None
    parse_status: str
    parse_error: str | None
    topic_hint: str | None
    language: str | None
    imported_at: datetime
    updated_at: datetime


class MaterialChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    material_id: str
    chunk_index: int
    heading_path: str | None
    content: str
    token_count: int | None
    metadata_json: dict
    created_at: datetime


class MaterialIngestResponse(BaseModel):
    material: MaterialRead
    workflow_run_id: str
    generated_draft_ids: list[str] = Field(default_factory=list)
    chunk_count: int = 0
