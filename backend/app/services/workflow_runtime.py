from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.entities import EventLog, WorkflowCheckpoint, WorkflowRun
from app.repos.workflows import EventLogRepository, WorkflowCheckpointRepository, WorkflowRunRepository
from app.schemas.workflow import WorkflowRunCreate


class WorkflowRuntime:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.runs = WorkflowRunRepository(db)
        self.checkpoints = WorkflowCheckpointRepository(db)
        self.events = EventLogRepository(db)

    def start_run(self, payload: WorkflowRunCreate) -> WorkflowRun:
        return self.runs.create(
            user_id=payload.user_id,
            workflow_type=payload.workflow_type,
            source_type=payload.source_type,
            source_ref_id=payload.source_ref_id,
            thread_id=payload.thread_id,
            status="queued",
            input_json=payload.input_json,
            output_json={},
            created_at=datetime.now(UTC),
        )

    def mark_running(self, run: WorkflowRun, current_node: str | None = None) -> WorkflowRun:
        run.status = "running"
        run.current_node = current_node
        if run.started_at is None:
            run.started_at = datetime.now(UTC)
        return self.runs.save(run)

    def mark_completed(self, run: WorkflowRun, output_json: dict | None = None) -> WorkflowRun:
        run.status = "succeeded"
        run.output_json = output_json or {}
        run.finished_at = datetime.now(UTC)
        return self.runs.save(run)

    def mark_failed(self, run: WorkflowRun, error_message: str) -> WorkflowRun:
        run.status = "failed"
        run.error_message = error_message
        run.finished_at = datetime.now(UTC)
        return self.runs.save(run)

    def add_checkpoint(self, run_id: str, node_name: str, state_json: dict, sequence_no: int) -> WorkflowCheckpoint:
        return self.checkpoints.create(
            run_id=run_id,
            node_name=node_name,
            state_json=state_json,
            sequence_no=sequence_no,
            created_at=datetime.now(UTC),
        )

    def add_event(
        self,
        user_id: str,
        event_type: str,
        event_name: str,
        payload_json: dict,
        run_id: str | None = None,
    ) -> EventLog:
        return self.events.create(
            user_id=user_id,
            run_id=run_id,
            event_type=event_type,
            event_name=event_name,
            payload_json=payload_json,
            created_at=datetime.now(UTC),
        )

