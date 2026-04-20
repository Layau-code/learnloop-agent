from __future__ import annotations

import logging
import re
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.entities import ChatMessage, ChatThread, EventLog, Material, MaterialChunk, WorkflowCheckpoint, WorkflowRun
from app.repos.chat import ChatThreadRepository
from app.repos.materials import MaterialChunkRepository, MaterialRepository
from app.services.model_adapter import ModelAdapter

logger = logging.getLogger(__name__)


@dataclass
class StudyQaResult:
    thread: ChatThread
    user_message: ChatMessage
    assistant_message: ChatMessage
    workflow_run: WorkflowRun


class StudyQaService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.materials = MaterialRepository(db)
        self.chunks = MaterialChunkRepository(db)
        self.threads = ChatThreadRepository(db)
        self.model_adapter = ModelAdapter()

    def ask_question(
        self,
        *,
        user_id: str,
        material_id: str,
        question: str,
        thread_id: str | None = None,
    ) -> StudyQaResult:
        material = self.materials.get(material_id)
        if material is None:
            raise ValueError("Material not found")

        clean_question = question.strip()
        if not clean_question:
            raise ValueError("Question cannot be empty")

        thread, should_create_thread = self._resolve_thread(
            user_id=user_id,
            material=material,
            thread_id=thread_id,
        )

        try:
            question_terms = self._extract_terms(clean_question)
            material_chunks = self.chunks.list_for_material(material.id)
            evidence_chunks = self._select_evidence_chunks(material_chunks, clean_question)

            answer, model_name = self._generate_answer(material, evidence_chunks, clean_question)
        except Exception as exc:
            run = self._record_failed_run(
                user_id=user_id,
                material_id=material.id,
                thread_id=thread.id if thread else None,
                question=clean_question,
                error_message=str(exc),
            )
            logger.exception("study_qa_failed material_id=%s thread_id=%s run_id=%s", material.id, thread.id if thread else None, run.id)
            raise

        try:
            if should_create_thread:
                thread = ChatThread(
                    user_id=user_id,
                    title=f"Study: {material.title}",
                    active_material_id=material.id,
                    active_topic=material.topic_hint,
                    status="active",
                )
                self.db.add(thread)
                self.db.flush()

            user_message = ChatMessage(
                thread_id=thread.id,
                role="user",
                message_type="question",
                content_md=clean_question,
                citations_json=[],
                retrieval_context_json={"material_id": material.id},
            )
            run = WorkflowRun(
                user_id=user_id,
                workflow_type="study_qa",
                source_type="material",
                source_ref_id=material.id,
                thread_id=thread.id,
                status="running",
                current_node="PersistChat",
                input_json={"question": clean_question},
                output_json={},
                started_at=datetime.now(UTC),
            )
            citations = [
                {
                    "material_id": material.id,
                    "chunk_id": chunk.id,
                    "chunk_index": chunk.chunk_index,
                }
                for chunk in evidence_chunks
            ]
            retrieval_context = {
                "material_id": material.id,
                "material_title": material.title,
                "evidence_chunk_count": len(evidence_chunks),
            }
            assistant_message = ChatMessage(
                thread_id=thread.id,
                role="assistant",
                message_type="answer",
                content_md=answer,
                citations_json=citations,
                retrieval_context_json=retrieval_context,
                model_name=model_name,
            )

            thread.last_active_at = datetime.now(UTC)
            self.db.add_all([run, user_message, assistant_message])
            self.db.flush()

            run.status = "succeeded"
            run.current_node = "PersistChat"
            run.output_json = {
                "thread_id": thread.id,
                "assistant_message_id": assistant_message.id,
            }
            run.finished_at = datetime.now(UTC)

            self.db.add_all(
                [
                    WorkflowCheckpoint(
                        run_id=run.id,
                        node_name="ParseQuestion",
                        state_json={"question_terms": question_terms},
                        sequence_no=1,
                    ),
                    WorkflowCheckpoint(
                        run_id=run.id,
                        node_name="RetrieveEvidence",
                        state_json={
                            "chunk_ids": [chunk.id for chunk in evidence_chunks],
                            "chunk_indexes": [chunk.chunk_index for chunk in evidence_chunks],
                        },
                        sequence_no=2,
                    ),
                    WorkflowCheckpoint(
                        run_id=run.id,
                        node_name="PersistChat",
                        state_json={
                            "thread_id": thread.id,
                            "user_message_id": user_message.id,
                            "assistant_message_id": assistant_message.id,
                        },
                        sequence_no=3,
                    ),
                    EventLog(
                        user_id=user_id,
                        run_id=run.id,
                        event_type="study_qa",
                        event_name="question_answered",
                        payload_json={
                            "material_id": material.id,
                            "thread_id": thread.id,
                            "assistant_message_id": assistant_message.id,
                        },
                    ),
                ]
            )
            self.db.commit()
            self.db.refresh(thread)
            self.db.refresh(run)
            self.db.refresh(user_message)
            self.db.refresh(assistant_message)

            logger.info("study_qa_answered material_id=%s thread_id=%s run_id=%s", material.id, thread.id, run.id)
            return StudyQaResult(
                thread=thread,
                user_message=user_message,
                assistant_message=assistant_message,
                workflow_run=run,
            )
        except Exception as exc:
            self.db.rollback()
            failed_run = self._record_failed_run(
                user_id=user_id,
                material_id=material.id,
                thread_id=thread.id if thread else None,
                question=clean_question,
                error_message=str(exc),
            )
            logger.exception("study_qa_persist_failed material_id=%s thread_id=%s run_id=%s", material.id, thread.id if thread else None, failed_run.id)
            raise

    def _resolve_thread(
        self,
        *,
        user_id: str,
        material: Material,
        thread_id: str | None,
    ) -> tuple[ChatThread | None, bool]:
        if thread_id:
            thread = self.threads.get_for_user(thread_id, user_id)
            if thread is None:
                raise ValueError("Chat thread not found")
            if thread.active_material_id != material.id:
                raise ValueError("Chat thread does not belong to the selected material")
            return thread, False

        existing = self.threads.list_for_material(user_id, material.id, limit=1)
        if existing:
            return existing[0], False

        return None, True

    def _record_failed_run(
        self,
        *,
        user_id: str,
        material_id: str,
        thread_id: str | None,
        question: str,
        error_message: str,
    ) -> WorkflowRun:
        run = WorkflowRun(
            id=str(uuid4()),
            user_id=user_id,
            workflow_type="study_qa",
            source_type="material",
            source_ref_id=material_id,
            thread_id=thread_id,
            status="failed",
            current_node="StudyQA",
            input_json={"question": question},
            output_json={},
            error_message=error_message,
            started_at=datetime.now(UTC),
            finished_at=datetime.now(UTC),
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def _extract_terms(self, question: str) -> list[str]:
        terms = re.findall(r"[A-Za-z0-9_]+|[\u4e00-\u9fff]{2,}", question.lower())
        return [term for term in terms if len(term) > 1]

    def _select_evidence_chunks(
        self,
        chunks: list[MaterialChunk],
        question: str,
        limit: int = 4,
    ) -> list[MaterialChunk]:
        if not chunks:
            return []

        terms = self._extract_terms(question)
        if not terms:
            return chunks[:limit]

        term_counter = Counter(terms)
        scored: list[tuple[int, int, MaterialChunk]] = []
        for chunk in chunks:
            content = chunk.content.lower()
            lexical_score = sum(content.count(term) * weight for term, weight in term_counter.items())
            scored.append((lexical_score, -chunk.chunk_index, chunk))

        scored.sort(reverse=True)
        selected = [chunk for score, _, chunk in scored if score > 0][:limit]
        return selected or chunks[:limit]

    def _generate_answer(
        self,
        material: Material,
        evidence_chunks: list[MaterialChunk],
        question: str,
    ) -> tuple[str, str | None]:
        evidence = "\n\n".join(
            f"[Chunk {chunk.chunk_index + 1}]\n{chunk.content}"
            for chunk in evidence_chunks
        ).strip()
        if not evidence:
            return (
                "我暂时没有从当前资料里找到足够的上下文来回答这个问题。\n\n"
                "建议你先补充更明确的资料内容，或者换一个更具体的问题。",
                None,
            )

        if self.model_adapter.is_enabled():
            prompt = (
                "You are answering a study question using only the provided material evidence.\n"
                "Respond in concise Chinese markdown.\n"
                "Requirements:\n"
                "- Answer the question directly.\n"
                "- Add a short section called `依据片段` listing the chunk numbers you used.\n"
                "- If the evidence is insufficient, say so explicitly.\n\n"
                f"Material title: {material.title}\n"
                f"Question: {question}\n\n"
                f"Evidence:\n{evidence}\n"
            )
            response = self.model_adapter.generate_text(prompt)
            return response.content.strip(), response.model_name

        summary_lines = [chunk.content.strip() for chunk in evidence_chunks[:2]]
        summary = "\n".join(f"- {line}" for line in summary_lines if line)
        chunk_refs = ", ".join(f"Chunk {chunk.chunk_index + 1}" for chunk in evidence_chunks)
        return (
            "## 回答\n"
            "当前未配置模型，这里先基于检索到的资料片段给出一版保守回答。\n\n"
            f"{summary}\n\n"
            "## 依据片段\n"
            f"- {chunk_refs}\n",
            None,
        )
