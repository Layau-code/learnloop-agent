from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repos.knowledge import KnowledgeRepository
from app.schemas.knowledge import KnowledgeItemRead

router = APIRouter()


@router.get("", response_model=list[KnowledgeItemRead])
def list_knowledge_items(
    q: str | None = Query(default=None, description="Search by title, summary, content, or topic"),
    db: Session = Depends(get_db),
) -> list[KnowledgeItemRead]:
    items = KnowledgeRepository(db).list_visible(query=q, limit=100)
    return [KnowledgeItemRead.model_validate(item) for item in items]


@router.get("/{item_id}", response_model=KnowledgeItemRead)
def get_knowledge_item(item_id: str, db: Session = Depends(get_db)) -> KnowledgeItemRead:
    item = KnowledgeRepository(db).get(item_id)
    if item is None or item.is_archived:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return KnowledgeItemRead.model_validate(item)
