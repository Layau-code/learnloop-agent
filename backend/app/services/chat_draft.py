from __future__ import annotations

import logging
import re

from sqlalchemy.orm import Session

from app.models.entities import ChatMessage, ChatThread, DistillDraft
from app.repos.chat import ChatMessageRepository
from app.repos.drafts import DistillDraftRepository
from app.services.workflow_runtime import WorkflowRuntime

logger = logging.getLogger(__name__)

ANSWER_SECTION_HEADINGS = {"回答", "answer", "依据片段", "引用", "参考", "source", "sources"}


class ChatDraftNotFoundError(ValueError):
    pass


class ChatDraftInvalidMessageError(ValueError):
    pass


class ChatDraftService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.messages = ChatMessageRepository(db)
        self.drafts = DistillDraftRepository(db)
        self.runtime = WorkflowRuntime(db)

    def create_from_message(self, *, user_id: str, message_id: str) -> DistillDraft:
        message_with_thread = self.messages.get_for_user(message_id, user_id)
        if message_with_thread is None:
            raise ChatDraftNotFoundError("Chat message not found")

        message, thread = message_with_thread
        if message.role != "assistant":
            raise ChatDraftInvalidMessageError("Only assistant answers can be saved as drafts")

        reusable_draft = self._find_reusable_draft(user_id=user_id, message_id=message.id)
        if reusable_draft is not None:
            return reusable_draft

        draft = self.drafts.create(
            user_id=user_id,
            source_type="chat_message",
            source_ref_id=message.id,
            draft_type="knowledge",
            title=self._build_title(thread, message),
            content_md=self._build_content(thread, message),
            structure_json={
                "thread_id": thread.id,
                "material_id": thread.active_material_id,
                "topic_hint": thread.active_topic,
                "source_type": "study_qa",
                "citations": message.citations_json,
                "retrieval_context": message.retrieval_context_json,
                "model_name": message.model_name,
            },
        )
        self.runtime.add_event(
            user_id=user_id,
            run_id=None,
            event_type="knowledge",
            event_name="chat_answer_saved_as_draft",
            payload_json={
                "draft_id": draft.id,
                "message_id": message.id,
                "thread_id": thread.id,
                "material_id": thread.active_material_id,
            },
        )
        logger.info("chat_answer_saved_as_draft message_id=%s draft_id=%s", message.id, draft.id)
        return draft

    def _find_reusable_draft(self, *, user_id: str, message_id: str) -> DistillDraft | None:
        drafts = self.drafts.list_for_source("chat_message", message_id)
        for draft in drafts:
            if draft.user_id == user_id and draft.status in {"pending", "approved"}:
                return draft
        return None

    def _build_title(self, thread: ChatThread, message: ChatMessage) -> str:
        title = thread.active_topic or thread.title or self._first_content_line(message)
        return f"{title[:220]} - 问答笔记"

    def _build_content(self, thread: ChatThread, message: ChatMessage) -> str:
        answer = self._clean_answer_content(message)
        topic = thread.active_topic or "general"
        return (
            f"# {self._build_title(thread, message)}\n\n"
            f"主题：{topic}\n\n"
            "## 核心回答\n"
            f"{answer}\n\n"
            "## 来源\n"
            "- 来自学习问答回答。\n"
            f"{self._build_citation_summary(message)}"
        )

    def _first_content_line(self, message: ChatMessage) -> str:
        for line in message.content_md.splitlines():
            stripped = line.strip().lstrip("#").strip()
            if stripped:
                return stripped
        return "Study answer"

    def _clean_answer_content(self, message: ChatMessage) -> str:
        cleaned_lines = []
        for line in message.content_md.splitlines():
            stripped = line.strip()
            heading = re.sub(r"^#{1,6}\s+", "", stripped).strip().lower()
            if heading in ANSWER_SECTION_HEADINGS:
                continue
            if re.match(r"^-\s*chunk\s+\d+", stripped, re.IGNORECASE):
                continue
            cleaned_lines.append(line)
        return "\n".join(cleaned_lines).strip() or "原回答内容为空。"

    def _build_citation_summary(self, message: ChatMessage) -> str:
        chunk_indexes = []
        for citation in message.citations_json:
            if not isinstance(citation, dict):
                continue
            raw_index = citation.get("chunk_index")
            if isinstance(raw_index, int):
                chunk_indexes.append(raw_index + 1)
        if not chunk_indexes:
            return ""
        chunks = "、".join(f"Chunk {index}" for index in chunk_indexes)
        return f"- 引用片段：{chunks}\n"
