from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkflowRunCreate(BaseModel):
    user_id: str
    workflow_type: str
    source_type: str | None = None
    source_ref_id: str | None = None
    thread_id: str | None = None
    input_json: dict = Field(default_factory=dict)


class WorkflowRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    workflow_type: str
    source_type: str | None
    source_ref_id: str | None
    thread_id: str | None
    status: str
    current_node: str | None
    input_json: dict
    output_json: dict
    error_message: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime


class WorkflowCheckpointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    node_name: str
    state_json: dict
    sequence_no: int
    created_at: datetime


class EventLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    run_id: str | None
    event_type: str
    event_name: str
    payload_json: dict
    created_at: datetime

