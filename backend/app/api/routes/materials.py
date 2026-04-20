from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_or_default_user_id
from app.db.session import get_db
from app.repos.materials import MaterialChunkRepository, MaterialRepository
from app.schemas.materials import MaterialChunkRead, MaterialCreate, MaterialIngestResponse, MaterialRead
from app.services.material_ingest import MaterialIngestService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=list[MaterialRead])
def list_materials(db: Session = Depends(get_db)) -> list[MaterialRead]:
    materials = MaterialRepository(db).list_recent(limit=100)
    return [MaterialRead.model_validate(material) for material in materials]


@router.post("", response_model=MaterialIngestResponse, status_code=201)
def create_material(
    payload: MaterialCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_or_default_user_id),
) -> MaterialIngestResponse:
    materials = MaterialRepository(db)
    material = materials.create(
        user_id=user_id,
        title=payload.title,
        source_type=payload.source_type,
        source_uri=payload.source_uri,
        mime_type=payload.mime_type,
        raw_text=payload.raw_text,
        topic_hint=payload.topic_hint,
    )

    ingest = MaterialIngestService(db)
    try:
        result = ingest.run(material.id)
    except Exception as exc:
        logger.exception("material_create_failed material_id=%s", material.id)
        raise HTTPException(status_code=500, detail="Material ingest failed") from exc

    logger.info("material_created material_id=%s run_id=%s", material.id, result["workflow_run"].id)
    return MaterialIngestResponse(
        material=MaterialRead.model_validate(result["material"]),
        workflow_run_id=result["workflow_run"].id,
        generated_draft_ids=[draft.id for draft in result["drafts"]],
        chunk_count=len(result["chunks"]),
    )


@router.get("/{material_id}", response_model=MaterialRead)
def get_material(material_id: str, db: Session = Depends(get_db)) -> MaterialRead:
    material = MaterialRepository(db).get(material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="Material not found")
    return MaterialRead.model_validate(material)


@router.get("/{material_id}/chunks", response_model=list[MaterialChunkRead])
def get_material_chunks(material_id: str, db: Session = Depends(get_db)) -> list[MaterialChunkRead]:
    chunks = MaterialChunkRepository(db).list_for_material(material_id)
    return [MaterialChunkRead.model_validate(chunk) for chunk in chunks]


@router.post("/{material_id}/reparse", response_model=MaterialIngestResponse)
def reparse_material(material_id: str, db: Session = Depends(get_db)) -> MaterialIngestResponse:
    material = MaterialRepository(db).get(material_id)
    if material is None:
        raise HTTPException(status_code=404, detail="Material not found")

    try:
        result = MaterialIngestService(db).run(material_id)
    except Exception as exc:
        logger.exception("material_reparse_failed material_id=%s", material_id)
        raise HTTPException(status_code=500, detail="Material ingest failed") from exc

    logger.info("material_reparsed material_id=%s run_id=%s", material.id, result["workflow_run"].id)
    return MaterialIngestResponse(
        material=MaterialRead.model_validate(result["material"]),
        workflow_run_id=result["workflow_run"].id,
        generated_draft_ids=[draft.id for draft in result["drafts"]],
        chunk_count=len(result["chunks"]),
    )
