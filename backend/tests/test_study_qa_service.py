from __future__ import annotations

import pathlib
import sys
import unittest
from types import SimpleNamespace
from uuid import uuid4

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.models.entities import ChatThread, Material, MaterialChunk, WorkflowRun
from app.services.study_qa import StudyQaService


class FakeSession:
    def __init__(self, fail_commit_once: bool = False) -> None:
        self.fail_commit_once = fail_commit_once
        self.pending: list[object] = []
        self.persisted: list[object] = []
        self.rollback_called = False

    def add(self, entity: object) -> None:
        self.pending.append(entity)

    def add_all(self, entities: list[object]) -> None:
        self.pending.extend(entities)

    def flush(self) -> None:
        for entity in self.pending:
            if getattr(entity, "id", None) is None:
                setattr(entity, "id", str(uuid4()))

    def commit(self) -> None:
        if self.fail_commit_once:
            self.fail_commit_once = False
            raise RuntimeError("commit failed")
        self.persisted.extend(self.pending)
        self.pending = []

    def rollback(self) -> None:
        self.rollback_called = True
        self.pending = []

    def refresh(self, entity: object) -> None:
        return None


def build_material(material_id: str) -> Material:
    return Material(
        id=material_id,
        user_id="user-1",
        title="Checkpoint note",
        source_type="note",
        topic_hint="langgraph",
        parse_status="completed",
    )


def build_chunk(material_id: str) -> MaterialChunk:
    return MaterialChunk(
        id="chunk-1",
        material_id=material_id,
        chunk_index=0,
        content="Checkpoints allow workflows to resume after interruption.",
        metadata_json={},
    )


class StudyQaServiceTests(unittest.TestCase):
    def test_ask_question_rejects_thread_from_other_material(self) -> None:
        db = FakeSession()
        service = StudyQaService(db)  # type: ignore[arg-type]
        service.materials = SimpleNamespace(get=lambda _: build_material("material-1"))
        service.chunks = SimpleNamespace(list_for_material=lambda _: [build_chunk("material-1")])
        service.threads = SimpleNamespace(
            get_for_user=lambda thread_id, user_id: ChatThread(
                id=thread_id,
                user_id=user_id,
                title="Study: other",
                active_material_id="material-2",
                status="active",
            ),
            list_for_material=lambda user_id, material_id, limit=1: [],
        )

        with self.assertRaisesRegex(ValueError, "does not belong to the selected material"):
            service.ask_question(
                user_id="user-1",
                material_id="material-1",
                question="为什么要 checkpoint？",
                thread_id="thread-1",
            )

    def test_ask_question_persist_failure_rolls_back_partial_chat_and_records_failed_run(self) -> None:
        db = FakeSession(fail_commit_once=True)
        service = StudyQaService(db)  # type: ignore[arg-type]
        material = build_material("material-1")
        thread = ChatThread(
            id="thread-1",
            user_id="user-1",
            title="Study: Checkpoint note",
            active_material_id="material-1",
            status="active",
        )
        service.materials = SimpleNamespace(get=lambda _: material)
        service.chunks = SimpleNamespace(list_for_material=lambda _: [build_chunk("material-1")])
        service.threads = SimpleNamespace(
            get_for_user=lambda thread_id, user_id: thread,
            list_for_material=lambda user_id, material_id, limit=1: [thread],
        )
        service.model_adapter = SimpleNamespace(is_enabled=lambda: False)

        with self.assertRaisesRegex(RuntimeError, "commit failed"):
            service.ask_question(
                user_id="user-1",
                material_id="material-1",
                question="interrupt 有什么作用？",
            )

        self.assertTrue(db.rollback_called)
        persisted_types = {type(entity).__name__ for entity in db.persisted}
        self.assertEqual(persisted_types, {"WorkflowRun"})

        failed_runs = [entity for entity in db.persisted if isinstance(entity, WorkflowRun)]
        self.assertEqual(len(failed_runs), 1)
        self.assertEqual(failed_runs[0].status, "failed")


if __name__ == "__main__":
    unittest.main()
