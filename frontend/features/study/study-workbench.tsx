"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { renderMarkdownPreview } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import { appQueryKeys } from "@/lib/query-keys";
import type {
  ChatMessage,
  ChatThread,
  DraftApproveResponse,
  DistillDraft,
  Material,
  MaterialChunk,
  MaterialIngestResponse,
  StudyQaAskResponse
} from "@/lib/types";

import { studyQueryKeys } from "./query-keys";
import { StudyQaPanel } from "./study-qa-panel";

type SourceType = "note" | "url";

type MaterialFormState = {
  title: string;
  sourceType: SourceType;
  sourceUri: string;
  rawText: string;
  topicHint: string;
};

const defaultFormState: MaterialFormState = {
  title: "",
  sourceType: "note",
  sourceUri: "",
  rawText: "",
  topicHint: ""
};

export function StudyWorkbench() {
  const queryClient = useQueryClient();
  const { messages, formatDateTime } = useLocale();
  const copy = messages.study;
  const [form, setForm] = useState<MaterialFormState>(defaultFormState);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const materialsQuery = useQuery({
    queryKey: studyQueryKeys.materials(),
    queryFn: () => apiGet<Material[]>("/materials")
  });

  const draftsQuery = useQuery({
    queryKey: [...studyQueryKeys.drafts(), "pending"],
    queryFn: () => apiGet<DistillDraft[]>("/drafts?status=pending")
  });

  const selectedMaterial = useMemo(
    () =>
      materialsQuery.data?.find((item) => item.id === selectedMaterialId) ??
      materialsQuery.data?.[0] ??
      null,
    [materialsQuery.data, selectedMaterialId]
  );

  const selectedMaterialDrafts = useMemo(
    () =>
      draftsQuery.data?.filter(
        (draft) => draft.source_type === "material" && draft.source_ref_id === selectedMaterial?.id
      ) ?? [],
    [draftsQuery.data, selectedMaterial?.id]
  );

  const chunksQuery = useQuery({
    queryKey: studyQueryKeys.materialChunks(selectedMaterial?.id),
    queryFn: () => apiGet<MaterialChunk[]>(`/materials/${selectedMaterial?.id}/chunks`),
    enabled: Boolean(selectedMaterial?.id)
  });

  const threadsQuery = useQuery({
    queryKey: studyQueryKeys.chatThreads(selectedMaterial?.id),
    queryFn: () => apiGet<ChatThread[]>(`/chat/threads?material_id=${selectedMaterial?.id}`),
    enabled: Boolean(selectedMaterial?.id)
  });

  const effectiveThreadId = activeThreadId ?? threadsQuery.data?.[0]?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: studyQueryKeys.chatMessages(effectiveThreadId),
    queryFn: () => apiGet<ChatMessage[]>(`/chat/threads/${effectiveThreadId}/messages`),
    enabled: Boolean(effectiveThreadId)
  });

  const createMaterialMutation = useMutation({
    mutationFn: (payload: MaterialFormState) =>
      apiPost<MaterialIngestResponse, Record<string, string | null>>("/materials", {
        title: payload.title.trim(),
        source_type: payload.sourceType,
        source_uri: payload.sourceType === "url" ? payload.sourceUri.trim() : null,
        raw_text: payload.sourceType === "note" ? payload.rawText.trim() : null,
        topic_hint: payload.topicHint.trim() || null
      }),
    onSuccess: async (result) => {
      setFeedbackMessage(`${copy.importAction} · ${result.material.title}`);
      setForm(defaultFormState);
      setSelectedMaterialId(result.material.id);
      setActiveThreadId(null);
      setQuestion("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.materials() }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.drafts() }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.materialChunksRoot() }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatThreadsRoot() }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatMessagesRoot() }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.knowledge() })
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  const approveDraftMutation = useMutation({
    mutationFn: (draftId: string) => apiPost<DraftApproveResponse>(`/drafts/${draftId}/approve`),
    onSuccess: async () => {
      setFeedbackMessage(copy.approved);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.drafts() }),
        queryClient.invalidateQueries({ queryKey: appQueryKeys.knowledge() })
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  const rejectDraftMutation = useMutation({
    mutationFn: (draftId: string) =>
      apiPost<DistillDraft, { reason: string }>(`/drafts/${draftId}/reject`, {
        reason: "Rejected in the study workbench"
      }),
    onSuccess: async () => {
      setFeedbackMessage(copy.rejected);
      await queryClient.invalidateQueries({ queryKey: studyQueryKeys.drafts() });
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  const askQuestionMutation = useMutation({
    mutationFn: () =>
      apiPost<StudyQaAskResponse, { material_id: string; question: string; thread_id: string | null }>(
        "/chat/ask",
        {
          material_id: selectedMaterial!.id,
          question: question.trim(),
          thread_id: effectiveThreadId
        }
      ),
    onSuccess: async (result) => {
      setFeedbackMessage(copy.qaSuccess);
      setQuestion("");
      setActiveThreadId(result.thread.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatThreads(selectedMaterial?.id) }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatMessages(result.thread.id) })
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackMessage(null);
    createMaterialMutation.mutate(form);
  }

  function handleAskQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMaterial || !question.trim()) {
      return;
    }
    setFeedbackMessage(null);
    askQuestionMutation.mutate();
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="lede">{copy.lede}</p>
      </div>

      <div className="dashboard-grid">
        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.createLabel}</p>
              <h3>{copy.createTitle}</h3>
            </div>
            <span className="pill">{form.sourceType === "note" ? copy.note : copy.url}</span>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{copy.titleField}</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={copy.titlePlaceholder}
              />
            </label>

            <label className="field">
              <span>{copy.sourceType}</span>
              <select
                value={form.sourceType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceType: event.target.value as SourceType,
                    sourceUri: "",
                    rawText: ""
                  }))
                }
              >
                <option value="note">{copy.note}</option>
                <option value="url">{copy.url}</option>
              </select>
            </label>

            {form.sourceType === "note" ? (
              <label className="field">
                <span>{copy.body}</span>
                <textarea
                  required
                  rows={10}
                  value={form.rawText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rawText: event.target.value }))
                  }
                  placeholder={copy.bodyPlaceholder}
                />
              </label>
            ) : (
              <label className="field">
                <span>{copy.urlField}</span>
                <input
                  required
                  type="url"
                  value={form.sourceUri}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceUri: event.target.value }))
                  }
                  placeholder={copy.urlPlaceholder}
                />
              </label>
            )}

            <label className="field">
              <span>{copy.topicHint}</span>
              <input
                value={form.topicHint}
                onChange={(event) =>
                  setForm((current) => ({ ...current, topicHint: event.target.value }))
                }
                placeholder={copy.topicHintPlaceholder}
              />
            </label>

            <div className="action-row">
              <button className="button-primary" type="submit" disabled={createMaterialMutation.isPending}>
                {createMaterialMutation.isPending ? copy.importing : copy.importAction}
              </button>
              {feedbackMessage ? <p className="status-text">{feedbackMessage}</p> : null}
            </div>
          </form>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.materialsLabel}</p>
              <h3>{copy.materialsTitle}</h3>
            </div>
            <span className="pill">
              {materialsQuery.data?.length ?? 0} {copy.itemCount}
            </span>
          </div>

          <div className="stack-list">
            {materialsQuery.isLoading ? <p className="muted">{copy.loadingMaterials}</p> : null}
            {materialsQuery.data?.map((material) => (
              <button
                key={material.id}
                type="button"
                className={`list-card ${selectedMaterial?.id === material.id ? "is-active" : ""}`}
                onClick={() => {
                  setSelectedMaterialId(material.id);
                  setActiveThreadId(null);
                  setQuestion("");
                }}
              >
                <strong>{material.title}</strong>
                <span>{material.topic_hint || copy.general}</span>
                <span>
                  {material.parse_status} · {formatDateTime(material.imported_at)}
                </span>
              </button>
            ))}
            {!materialsQuery.isLoading && !materialsQuery.data?.length ? (
              <p className="muted">{copy.noMaterials}</p>
            ) : null}
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.currentMaterialLabel}</p>
              <h3>{copy.currentMaterialTitle}</h3>
            </div>
            {selectedMaterial ? <span className="pill">{selectedMaterial.language || copy.unknownLanguage}</span> : null}
          </div>

          {!selectedMaterial ? (
            <p className="muted">{copy.currentMaterialEmpty}</p>
          ) : (
            <div className="stack-list">
              <div className="detail-panel">
                <h4>{selectedMaterial.title}</h4>
                <p className="muted">
                  {selectedMaterial.source_type} · {selectedMaterial.parse_status}
                  {selectedMaterial.parse_error ? ` · ${selectedMaterial.parse_error}` : ""}
                </p>
                <p>{selectedMaterial.normalized_text || selectedMaterial.raw_text || copy.noBody}</p>
              </div>

              <div className="detail-panel">
                <h4>{copy.chunksTitle}</h4>
                {chunksQuery.isLoading ? <p className="muted">{copy.loadingChunks}</p> : null}
                {chunksQuery.data?.map((chunk) => (
                  <div key={chunk.id} className="chunk-card">
                    <span className="pill subtle">#{chunk.chunk_index + 1}</span>
                    <p>{chunk.content}</p>
                  </div>
                ))}
                {!chunksQuery.isLoading && !chunksQuery.data?.length ? (
                  <p className="muted">{copy.noChunks}</p>
                ) : null}
              </div>
            </div>
          )}
        </article>

        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.draftsLabel}</p>
              <h3>{copy.draftsTitle}</h3>
            </div>
            <span className="pill">
              {selectedMaterialDrafts.length} {copy.draftCount}
            </span>
          </div>

          <div className="stack-list">
            {!selectedMaterial ? (
              <p className="muted">{copy.draftsEmptyHint}</p>
            ) : null}
            {selectedMaterialDrafts.map((draft) => (
              <article key={draft.id} className="detail-panel">
                <div className="draft-header">
                  <div>
                    <h4>{draft.title}</h4>
                    <p className="muted">
                      {draft.status} · {formatDateTime(draft.updated_at)}
                    </p>
                  </div>
                  <div className="action-row compact">
                    <button
                      type="button"
                      className="button-primary"
                      disabled={approveDraftMutation.isPending || draft.status !== "pending"}
                      onClick={() => approveDraftMutation.mutate(draft.id)}
                    >
                      {copy.approve}
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={rejectDraftMutation.isPending || draft.status !== "pending"}
                      onClick={() => rejectDraftMutation.mutate(draft.id)}
                    >
                      {copy.reject}
                    </button>
                  </div>
                </div>
                <div className="markdown-preview">
                  {renderMarkdownPreview(draft.content_md).map((line, index) => (
                    <p key={`${draft.id}-${index}`}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
            {selectedMaterial && !selectedMaterialDrafts.length ? (
              <p className="muted">{copy.noDrafts}</p>
            ) : null}
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <StudyQaPanel
          selectedMaterial={selectedMaterial}
          question={question}
          onQuestionChange={setQuestion}
          onSubmit={handleAskQuestion}
          isSubmitting={askQuestionMutation.isPending}
          effectiveThreadId={effectiveThreadId}
          isLoadingMessages={threadsQuery.isLoading || messagesQuery.isLoading}
          messages={messagesQuery.data ?? []}
          formatTime={formatDateTime}
          renderMarkdownPreview={renderMarkdownPreview}
        />

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.scopeLabel}</p>
              <h3>{copy.scopeTitle}</h3>
            </div>
          </div>
          <div className="stack-list">
            <div className="detail-panel">
              <h4>{copy.supported}</h4>
              <p>{copy.supportedDescription}</p>
            </div>
            <div className="detail-panel">
              <h4>{copy.unsupported}</h4>
              <p>{copy.unsupportedDescription}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
