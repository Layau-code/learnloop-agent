from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.entities import Material
from app.repos.materials import MaterialRepository
from app.schemas.workflow import WorkflowRunCreate
from app.services.material_chunking import MaterialChunkingService
from app.services.material_draft import MaterialDraftService
from app.services.material_indexing import MaterialIndexingService
from app.services.material_parser import MaterialParserService
from app.services.model_adapter import ModelAdapter
from app.services.workflow_runtime import WorkflowRuntime

logger = logging.getLogger(__name__)


class MaterialIngestService:
    def __init__(self, db: Session, model_adapter: ModelAdapter | None = None) -> None:
        self.db = db
        self.model_adapter = model_adapter or ModelAdapter()
        self.materials = MaterialRepository(db)
        self.runtime = WorkflowRuntime(db)
        self.parser = MaterialParserService()
        self.chunking = MaterialChunkingService()
        self.indexing = MaterialIndexingService(db, self.model_adapter)
        self.drafts = MaterialDraftService(db, self.model_adapter)

    def run(self, material_id: str) -> dict:
        material = self.materials.get(material_id)
        if material is None:
            raise ValueError(f"Material {material_id} not found")

        run = self.runtime.start_run(
            WorkflowRunCreate(
                user_id=material.user_id,
                workflow_type="material_ingest",
                source_type="material",
                source_ref_id=material.id,
                input_json={"material_id": material.id},
            )
        )
        self.runtime.add_event(
            user_id=material.user_id,
            run_id=run.id,
            event_type="workflow",
            event_name="material_ingest.started",
            payload_json={"material_id": material.id},
        )

        try:
            self.runtime.mark_running(run, current_node="NormalizeContent")
            normalized_text, language = self.parser.parse(material)
            material.normalized_text = normalized_text
            material.language = language
            material.parse_status = "running"
            material.parse_error = None
            material = self.materials.save(material)
            self.runtime.add_checkpoint(run.id, "NormalizeContent", {"language": language}, 1)

            self.runtime.mark_running(run, current_node="ChunkMaterial")
            chunk_payloads = self.chunking.chunk(normalized_text)
            self.runtime.add_checkpoint(run.id, "ChunkMaterial", {"chunk_count": len(chunk_payloads)}, 2)

            self.runtime.mark_running(run, current_node="IndexChunks")
            saved_chunks = self.indexing.replace_chunks(material.id, chunk_payloads)
            self.runtime.add_checkpoint(run.id, "IndexChunks", {"chunk_count": len(saved_chunks)}, 3)

            self.runtime.mark_running(run, current_node="ExtractKnowledgeDraft")
            draft = self.drafts.generate_material_draft(material)
            self.runtime.add_checkpoint(run.id, "ExtractKnowledgeDraft", {"draft_id": draft.id}, 4)

            material.parse_status = "succeeded"
            material = self.materials.save(material)
            self.runtime.add_event(
                user_id=material.user_id,
                run_id=run.id,
                event_type="draft",
                event_name="material_draft.generated",
                payload_json={"draft_id": draft.id},
            )
            run = self.runtime.mark_completed(
                run,
                output_json={
                    "material_id": material.id,
                    "chunk_count": len(saved_chunks),
                    "draft_ids": [draft.id],
                },
            )
            logger.info(
                "material_ingest_completed material_id=%s run_id=%s chunk_count=%s draft_id=%s",
                material.id,
                run.id,
                len(saved_chunks),
                draft.id,
            )
            return {
                "material": material,
                "workflow_run": run,
                "chunks": saved_chunks,
                "drafts": [draft],
            }
        except Exception as exc:
            logger.exception("material_ingest_failed material_id=%s", material.id)
            material.parse_status = "failed"
            material.parse_error = str(exc)
            self.materials.save(material)
            self.runtime.mark_failed(run, str(exc))
            self.runtime.add_event(
                user_id=material.user_id,
                run_id=run.id,
                event_type="workflow",
                event_name="material_ingest.failed",
                payload_json={"error": str(exc)},
            )
            raise

