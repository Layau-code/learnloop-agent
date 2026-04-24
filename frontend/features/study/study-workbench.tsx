"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
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
import { StudyContextRail } from "./study-context-rail";
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

function getDraftThreadId(draft: DistillDraft): string | null {
  const threadId = draft.structure_json.thread_id;
  return typeof threadId === "string" ? threadId : null;
}

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

  const visibleDrafts = useMemo(() => {
    const messageIds = new Set((messagesQuery.data ?? []).map((message) => message.id));
    return (
      draftsQuery.data?.filter((draft) => {
        if (draft.source_type === "material") {
          return draft.source_ref_id === selectedMaterial?.id;
        }
        if (draft.source_type !== "chat_message") {
          return false;
        }
        return messageIds.has(draft.source_ref_id) || getDraftThreadId(draft) === effectiveThreadId;
      }) ?? []
    );
  }, [draftsQuery.data, effectiveThreadId, messagesQuery.data, selectedMaterial?.id]);

  const savedAnswerMessageIds = useMemo(
    () =>
      visibleDrafts
        .filter((draft) => draft.source_type === "chat_message")
        .map((draft) => draft.source_ref_id),
    [visibleDrafts]
  );

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
    mutationFn: () => {
      const materialId = selectedMaterial!.id;
      return apiPost<StudyQaAskResponse, { material_id: string; question: string; thread_id: string | null }>(
        "/chat/ask",
        {
          material_id: materialId,
          question: question.trim(),
          thread_id: effectiveThreadId
        }
      ).then((response) => ({ response, materialId }));
    },
    onSuccess: async (result) => {
      setFeedbackMessage(copy.qaSuccess);
      setQuestion("");
      if (selectedMaterial?.id === result.materialId) {
        setActiveThreadId(result.response.thread.id);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatThreads(result.materialId) }),
        queryClient.invalidateQueries({ queryKey: studyQueryKeys.chatMessages(result.response.thread.id) })
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  const saveAnswerDraftMutation = useMutation({
    mutationFn: (messageId: string) => apiPost<DistillDraft>(`/chat/messages/${messageId}/draft`),
    onSuccess: async () => {
      setFeedbackMessage(copy.answerDraftSaved);
      await queryClient.invalidateQueries({ queryKey: studyQueryKeys.drafts() });
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
    <section className="study-thread-page">
      <div className="study-editor-main">
        <header className="study-workspace-header">
          <div className="study-workspace-copy">
            <p className="card-label">{copy.qaLabel}</p>
            <h2>{selectedMaterial?.title ?? copy.title}</h2>
            <p>{selectedMaterial?.topic_hint || copy.lede}</p>
          </div>

          <div className="study-workspace-meta">
            <span className="pill subtle">
              {effectiveThreadId ? copy.threadReady : selectedMaterial ? copy.qaTitle : copy.materialsTitle}
            </span>
            <span className="pill subtle">
              {(messagesQuery.data ?? []).length} {copy.itemCount}
            </span>
            {selectedMaterial?.language ? (
              <span className="pill subtle">{selectedMaterial.language}</span>
            ) : null}
          </div>
        </header>

        {feedbackMessage ? (
          <div className="workspace-feedback" role="status">
            {feedbackMessage}
          </div>
        ) : null}

        <StudyQaPanel
          selectedMaterial={selectedMaterial}
          question={question}
          onQuestionChange={setQuestion}
          onSubmit={handleAskQuestion}
          isSubmitting={askQuestionMutation.isPending}
          isLoadingMessages={threadsQuery.isLoading || messagesQuery.isLoading}
          messages={messagesQuery.data ?? []}
          formatTime={formatDateTime}
          onSaveAnswer={(messageId) => {
            setFeedbackMessage(null);
            saveAnswerDraftMutation.mutate(messageId);
          }}
          savingAnswerMessageId={
            saveAnswerDraftMutation.isPending ? saveAnswerDraftMutation.variables ?? null : null
          }
          savedAnswerMessageIds={savedAnswerMessageIds}
        />
      </div>

      <StudyContextRail
        materials={materialsQuery.data ?? []}
        selectedMaterial={selectedMaterial}
        isLoadingMaterials={materialsQuery.isLoading}
        visibleDrafts={visibleDrafts}
        chunks={chunksQuery.data ?? []}
        isLoadingChunks={chunksQuery.isLoading}
        form={form}
        feedbackMessage={feedbackMessage}
        isCreatingMaterial={createMaterialMutation.isPending}
        isApprovingDraft={approveDraftMutation.isPending}
        isRejectingDraft={rejectDraftMutation.isPending}
        formatTime={formatDateTime}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onSelectMaterial={(materialId) => {
          setSelectedMaterialId(materialId);
          setActiveThreadId(null);
          setQuestion("");
        }}
        onApproveDraft={(draftId) => approveDraftMutation.mutate(draftId)}
        onRejectDraft={(draftId) => rejectDraftMutation.mutate(draftId)}
      />
    </section>
  );
}
