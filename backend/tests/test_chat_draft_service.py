from __future__ import annotations

import pathlib
import sys
import unittest
from types import SimpleNamespace

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.models.entities import ChatMessage, ChatThread, DistillDraft
from app.services.chat_draft import ChatDraftInvalidMessageError, ChatDraftService


class FakeDraftRepo:
    def __init__(self, existing: list[DistillDraft] | None = None) -> None:
        self.existing = existing or []
        self.created: list[DistillDraft] = []

    def list_for_source(self, source_type: str, source_ref_id: str) -> list[DistillDraft]:
        return [
            draft
            for draft in self.existing
            if draft.source_type == source_type and draft.source_ref_id == source_ref_id
        ]

    def create(self, **kwargs: object) -> DistillDraft:
        draft = DistillDraft(id="draft-1", status="pending", **kwargs)
        self.created.append(draft)
        return draft


class FakeRuntime:
    def __init__(self) -> None:
        self.events: list[dict[str, object]] = []

    def add_event(self, **kwargs: object) -> None:
        self.events.append(kwargs)


def build_thread() -> ChatThread:
    return ChatThread(
        id="thread-1",
        user_id="user-1",
        title="Study: Checkpoint note",
        active_material_id="material-1",
        active_topic="langgraph",
        status="active",
    )


def build_message(role: str = "assistant") -> ChatMessage:
    return ChatMessage(
        id="message-1",
        thread_id="thread-1",
        role=role,
        message_type="answer",
        content_md="## 回答\nCheckpoints allow workflows to resume.",
        citations_json=[{"chunk_id": "chunk-1", "chunk_index": 0}],
        retrieval_context_json={"material_id": "material-1"},
    )


class ChatDraftServiceTests(unittest.TestCase):
    def test_create_from_assistant_message_generates_pending_draft(self) -> None:
        service = ChatDraftService(SimpleNamespace())  # type: ignore[arg-type]
        draft_repo = FakeDraftRepo()
        runtime = FakeRuntime()
        service.messages = SimpleNamespace(
            get_for_user=lambda message_id, user_id: (build_message(), build_thread())
        )
        service.drafts = draft_repo  # type: ignore[assignment]
        service.runtime = runtime  # type: ignore[assignment]

        draft = service.create_from_message(user_id="user-1", message_id="message-1")

        self.assertEqual(draft.source_type, "chat_message")
        self.assertEqual(draft.source_ref_id, "message-1")
        self.assertEqual(draft.status, "pending")
        self.assertIn("Checkpoints allow workflows to resume.", draft.content_md)
        self.assertEqual(draft.structure_json["thread_id"], "thread-1")
        self.assertEqual(draft.structure_json["material_id"], "material-1")
        self.assertEqual(len(draft_repo.created), 1)
        self.assertEqual(runtime.events[0]["event_name"], "chat_answer_saved_as_draft")

    def test_create_from_message_rejects_non_assistant_messages(self) -> None:
        service = ChatDraftService(SimpleNamespace())  # type: ignore[arg-type]
        service.messages = SimpleNamespace(
            get_for_user=lambda message_id, user_id: (build_message(role="user"), build_thread())
        )
        service.drafts = FakeDraftRepo()  # type: ignore[assignment]
        service.runtime = FakeRuntime()  # type: ignore[assignment]

        with self.assertRaisesRegex(ChatDraftInvalidMessageError, "assistant answers"):
            service.create_from_message(user_id="user-1", message_id="message-1")

    def test_create_from_message_reuses_existing_pending_draft(self) -> None:
        existing = DistillDraft(
            id="draft-existing",
            user_id="user-1",
            source_type="chat_message",
            source_ref_id="message-1",
            draft_type="knowledge",
            title="Existing draft",
            content_md="Existing content",
            structure_json={},
            status="pending",
        )
        draft_repo = FakeDraftRepo(existing=[existing])
        runtime = FakeRuntime()
        service = ChatDraftService(SimpleNamespace())  # type: ignore[arg-type]
        service.messages = SimpleNamespace(
            get_for_user=lambda message_id, user_id: (build_message(), build_thread())
        )
        service.drafts = draft_repo  # type: ignore[assignment]
        service.runtime = runtime  # type: ignore[assignment]

        draft = service.create_from_message(user_id="user-1", message_id="message-1")

        self.assertEqual(draft.id, "draft-existing")
        self.assertEqual(draft_repo.created, [])
        self.assertEqual(runtime.events, [])


if __name__ == "__main__":
    unittest.main()
