from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_or_default_user_id
from app.db.session import get_db
from app.repos.chat import ChatMessageRepository, ChatThreadRepository
from app.schemas.chat import ChatMessageRead, ChatThreadRead, StudyQaAskRequest, StudyQaAskResponse
from app.schemas.drafts import DistillDraftRead
from app.services.chat_draft import (
    ChatDraftInvalidMessageError,
    ChatDraftNotFoundError,
    ChatDraftService,
)
from app.services.study_qa import StudyQaService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/threads", response_model=list[ChatThreadRead])
def list_threads(
    material_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_or_default_user_id),
) -> list[ChatThreadRead]:
    repo = ChatThreadRepository(db)
    threads = repo.list_for_material(user_id, material_id, limit=20) if material_id else repo.list_for_user(user_id, limit=20)
    return [ChatThreadRead.model_validate(thread) for thread in threads]


@router.get("/threads/{thread_id}/messages", response_model=list[ChatMessageRead])
def list_messages(
    thread_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_or_default_user_id),
) -> list[ChatMessageRead]:
    thread = ChatThreadRepository(db).get_for_user(thread_id, user_id)
    if thread is None:
        raise HTTPException(status_code=404, detail="Chat thread not found")
    messages = ChatMessageRepository(db).list_for_thread(thread_id)
    return [ChatMessageRead.model_validate(message) for message in messages]


@router.post("/ask", response_model=StudyQaAskResponse)
def ask_question(
    payload: StudyQaAskRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_or_default_user_id),
) -> StudyQaAskResponse:
    try:
        result = StudyQaService(db).ask_question(
            user_id=user_id,
            material_id=payload.material_id,
            question=payload.question,
            thread_id=payload.thread_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("study_qa_request_failed material_id=%s", payload.material_id)
        raise HTTPException(status_code=500, detail="Study QA failed") from exc

    return StudyQaAskResponse(
        thread=ChatThreadRead.model_validate(result.thread),
        user_message=ChatMessageRead.model_validate(result.user_message),
        assistant_message=ChatMessageRead.model_validate(result.assistant_message),
        workflow_run_id=result.workflow_run.id,
    )


@router.post("/messages/{message_id}/draft", response_model=DistillDraftRead)
def save_answer_as_draft(
    message_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_or_default_user_id),
) -> DistillDraftRead:
    try:
        draft = ChatDraftService(db).create_from_message(user_id=user_id, message_id=message_id)
    except ChatDraftNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ChatDraftInvalidMessageError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("chat_answer_draft_failed message_id=%s", message_id)
        raise HTTPException(status_code=500, detail="Saving answer as draft failed") from exc

    return DistillDraftRead.model_validate(draft)
