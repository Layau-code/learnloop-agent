from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.entities import LearningPlan, LearningTask, ReflectionReport
from app.repos.base import BaseRepository


class ReflectionRepository(BaseRepository[ReflectionReport]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ReflectionReport)


class LearningPlanRepository(BaseRepository[LearningPlan]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, LearningPlan)


class LearningTaskRepository(BaseRepository[LearningTask]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, LearningTask)

