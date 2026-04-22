from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.entities import DistillDraft, KnowledgeItem
from app.repos.drafts import DistillDraftRepository
from app.repos.knowledge import KnowledgeLinkRepository, KnowledgeRepository
from app.repos.materials import MaterialRepository
from app.services.workflow_runtime import WorkflowRuntime

logger = logging.getLogger(__name__)


class KnowledgeWriteService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.drafts = DistillDraftRepository(db)
        self.knowledge = KnowledgeRepository(db)
        self.links = KnowledgeLinkRepository(db)
        self.materials = MaterialRepository(db)
        self.runtime = WorkflowRuntime(db)

    def approve_draft(self, draft_id: str) -> tuple[DistillDraft, KnowledgeItem]:
        draft = self._require_draft(draft_id)
        if draft.status == "rejected":
            raise ValueError("Rejected draft cannot be approved")

        existing_item_id = draft.structure_json.get("knowledge_item_id")
        if draft.status == "approved" and existing_item_id:
            existing_item = self.knowledge.get(existing_item_id)
            if existing_item is None:
                raise ValueError("Approved draft is missing its linked knowledge item")
            return draft, existing_item

        material = None
        topic = draft.structure_json.get("topic_hint")
        material_id = None
        if draft.source_type == "material":
            material_id = draft.source_ref_id
        elif draft.source_type == "chat_message":
            raw_material_id = draft.structure_json.get("material_id")
            material_id = raw_material_id if isinstance(raw_material_id, str) else None

        if material_id:
            material = self.materials.get(material_id)
            if material is None and draft.source_type == "material":
                raise ValueError("Source material not found")
            if material is not None:
                topic = topic or material.topic_hint

        summary = self._extract_summary(draft.content_md)
        knowledge_item = self.knowledge.create(
            user_id=draft.user_id,
            title=draft.title,
            item_type="note",
            topic=topic,
            summary=summary,
            content_md=draft.content_md,
            tags=self._build_tags(draft, topic),
            source_scope="private",
            confidence_score=0.72,
        )
        if material is not None:
            self.links.create(
                material_id=material.id,
                knowledge_item_id=knowledge_item.id,
                relation_type="distilled_from",
            )

        draft.status = "approved"
        draft.rejection_reason = None
        draft.structure_json = {
            **draft.structure_json,
            "knowledge_item_id": knowledge_item.id,
        }
        saved_draft = self.drafts.save(draft)

        self.runtime.add_event(
            user_id=draft.user_id,
            run_id=None,
            event_type="knowledge",
            event_name="draft_approved_to_knowledge",
            payload_json={
                "draft_id": draft.id,
                "knowledge_item_id": knowledge_item.id,
                "source_type": draft.source_type,
                "source_ref_id": draft.source_ref_id,
            },
        )
        logger.info("draft_approved draft_id=%s knowledge_item_id=%s", draft.id, knowledge_item.id)
        return saved_draft, knowledge_item

    def reject_draft(self, draft_id: str, reason: str | None = None) -> DistillDraft:
        draft = self._require_draft(draft_id)
        if draft.status == "approved":
            raise ValueError("Approved draft cannot be rejected")

        draft.status = "rejected"
        draft.rejection_reason = reason or "Rejected in review"
        saved_draft = self.drafts.save(draft)
        self.runtime.add_event(
            user_id=draft.user_id,
            run_id=None,
            event_type="knowledge",
            event_name="draft_rejected",
            payload_json={
                "draft_id": draft.id,
                "source_type": draft.source_type,
                "source_ref_id": draft.source_ref_id,
                "reason": saved_draft.rejection_reason,
            },
        )
        logger.info("draft_rejected draft_id=%s", draft.id)
        return saved_draft

    def _require_draft(self, draft_id: str) -> DistillDraft:
        draft = self.drafts.get(draft_id)
        if draft is None:
            raise ValueError("Draft not found")
        return draft

    def _extract_summary(self, content_md: str) -> str:
        lines = [line.strip() for line in content_md.splitlines() if line.strip()]
        body_lines = [line for line in lines if not line.startswith("#")]
        summary = " ".join(body_lines[:3]).strip()
        return summary[:280]

    def _build_tags(self, draft: DistillDraft, topic: str | None) -> list[str]:
        tags = []
        if topic:
            tags.append(topic)
        language = draft.structure_json.get("language")
        if language:
            tags.append(language)
        source_type = draft.structure_json.get("source_type")
        if source_type:
            tags.append(source_type)
        return tags
