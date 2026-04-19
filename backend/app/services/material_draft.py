from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.entities import DistillDraft, Material
from app.repos.drafts import DistillDraftRepository
from app.services.model_adapter import ModelAdapter

logger = logging.getLogger(__name__)


class MaterialDraftService:
    def __init__(self, db: Session, model_adapter: ModelAdapter) -> None:
        self.db = db
        self.model_adapter = model_adapter
        self.drafts = DistillDraftRepository(db)

    def generate_material_draft(self, material: Material) -> DistillDraft:
        content_md = self._build_draft_content(material)
        draft = self.drafts.create(
            user_id=material.user_id,
            source_type="material",
            source_ref_id=material.id,
            draft_type="knowledge",
            title=f"{material.title} - distilled note",
            content_md=content_md,
            structure_json={
                "topic_hint": material.topic_hint,
                "language": material.language,
                "source_type": material.source_type,
            },
        )
        logger.info("material_draft_generated material_id=%s draft_id=%s", material.id, draft.id)
        return draft

    def _build_draft_content(self, material: Material) -> str:
        excerpt = (material.normalized_text or material.raw_text or "").strip()[:1200]
        if not excerpt:
            return f"# {material.title}\n\nNo content was available for distillation."

        if self.model_adapter.is_enabled():
            prompt = (
                "You are distilling a study material into a concise markdown note.\n"
                "Return a short note with sections: Summary, Key Points, Open Questions.\n\n"
                f"Title: {material.title}\n\n"
                f"Content:\n{excerpt}"
            )
            response = self.model_adapter.generate_text(prompt)
            return response.content.strip() or f"# {material.title}\n\n{excerpt}"

        first_paragraph = excerpt.split("\n\n")[0].strip()
        return (
            f"# {material.title}\n\n"
            "## Summary\n"
            f"{first_paragraph}\n\n"
            "## Key Points\n"
            "- Initial distilled note generated without model support.\n\n"
            "## Open Questions\n"
            "- Review and expand this draft during approval.\n"
        )

