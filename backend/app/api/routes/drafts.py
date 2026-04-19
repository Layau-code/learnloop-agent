from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repos.drafts import DistillDraftRepository
from app.schemas.drafts import DraftApproveResponse, DraftRejectRequest, DistillDraftRead
from app.services.knowledge_write import KnowledgeWriteService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=list[DistillDraftRead])
def list_drafts(
    status: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    source_ref_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DistillDraftRead]:
    drafts = DistillDraftRepository(db).list_filtered(
        status=status,
        source_type=source_type,
        source_ref_id=source_ref_id,
    )
    return [DistillDraftRead.model_validate(draft) for draft in drafts]


@router.get("/{draft_id}", response_model=DistillDraftRead)
def get_draft(draft_id: str, db: Session = Depends(get_db)) -> DistillDraftRead:
    draft = DistillDraftRepository(db).get(draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")
    return DistillDraftRead.model_validate(draft)


@router.post("/{draft_id}/approve", response_model=DraftApproveResponse)
def approve_draft(draft_id: str, db: Session = Depends(get_db)) -> DraftApproveResponse:
    draft = DistillDraftRepository(db).get(draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    try:
        approved_draft, knowledge_item = KnowledgeWriteService(db).approve_draft(draft_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("draft_approve_failed draft_id=%s", draft_id)
        raise HTTPException(status_code=500, detail="Draft approval failed") from exc

    return DraftApproveResponse(
        draft=DistillDraftRead.model_validate(approved_draft),
        knowledge_item_id=knowledge_item.id,
    )


@router.post("/{draft_id}/reject", response_model=DistillDraftRead)
def reject_draft(
    draft_id: str,
    payload: DraftRejectRequest,
    db: Session = Depends(get_db),
) -> DistillDraftRead:
    draft = DistillDraftRepository(db).get(draft_id)
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")

    try:
        rejected_draft = KnowledgeWriteService(db).reject_draft(draft_id, payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("draft_reject_failed draft_id=%s", draft_id)
        raise HTTPException(status_code=500, detail="Draft rejection failed") from exc

    return DistillDraftRead.model_validate(rejected_draft)
