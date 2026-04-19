from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import EventLog, WorkflowCheckpoint, WorkflowRun
from app.repos.base import BaseRepository


class WorkflowRunRepository(BaseRepository[WorkflowRun]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, WorkflowRun)


class WorkflowCheckpointRepository(BaseRepository[WorkflowCheckpoint]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, WorkflowCheckpoint)

    def list_for_run(self, run_id: str) -> list[WorkflowCheckpoint]:
        return list(
            self.db.query(WorkflowCheckpoint)
            .filter(WorkflowCheckpoint.run_id == run_id)
            .order_by(WorkflowCheckpoint.sequence_no.asc())
        )


class EventLogRepository(BaseRepository[EventLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, EventLog)

    def list_for_run(self, run_id: str) -> list[EventLog]:
        return list(
            self.db.query(EventLog)
            .filter(EventLog.run_id == run_id)
            .order_by(EventLog.created_at.asc())
        )

