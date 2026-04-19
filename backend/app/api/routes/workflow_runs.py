from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repos.workflows import EventLogRepository, WorkflowCheckpointRepository, WorkflowRunRepository
from app.schemas.workflow import EventLogRead, WorkflowCheckpointRead, WorkflowRunCreate, WorkflowRunRead
from app.services.workflow_runtime import WorkflowRuntime

router = APIRouter()


@router.get("", response_model=list[WorkflowRunRead])
def list_workflow_runs(db: Session = Depends(get_db)) -> list[WorkflowRunRead]:
    runs = WorkflowRunRepository(db).list(limit=100)
    return [WorkflowRunRead.model_validate(run) for run in runs]


@router.post("", response_model=WorkflowRunRead)
def create_workflow_run(payload: WorkflowRunCreate, db: Session = Depends(get_db)) -> WorkflowRunRead:
    runtime = WorkflowRuntime(db)
    run = runtime.start_run(payload)
    runtime.add_event(
        user_id=payload.user_id,
        run_id=run.id,
        event_type="workflow",
        event_name="run.created",
        payload_json={"workflow_type": payload.workflow_type},
    )
    return WorkflowRunRead.model_validate(run)


@router.get("/{run_id}", response_model=WorkflowRunRead)
def get_workflow_run(run_id: str, db: Session = Depends(get_db)) -> WorkflowRunRead:
    run = WorkflowRunRepository(db).get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return WorkflowRunRead.model_validate(run)


@router.get("/{run_id}/events", response_model=list[EventLogRead])
def list_run_events(run_id: str, db: Session = Depends(get_db)) -> list[EventLogRead]:
    events = EventLogRepository(db).list_for_run(run_id)
    return [EventLogRead.model_validate(event) for event in events]


@router.get("/{run_id}/checkpoints", response_model=list[WorkflowCheckpointRead])
def list_run_checkpoints(run_id: str, db: Session = Depends(get_db)) -> list[WorkflowCheckpointRead]:
    checkpoints = WorkflowCheckpointRepository(db).list_for_run(run_id)
    return [WorkflowCheckpointRead.model_validate(checkpoint) for checkpoint in checkpoints]

