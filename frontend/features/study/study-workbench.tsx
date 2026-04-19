"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type {
  DraftApproveResponse,
  DistillDraft,
  Material,
  MaterialChunk,
  MaterialIngestResponse
} from "@/lib/types";

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

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderMarkdownPreview(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function StudyWorkbench() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MaterialFormState>(defaultFormState);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const materialsQuery = useQuery({
    queryKey: ["materials"],
    queryFn: () => apiGet<Material[]>("/materials")
  });

  const draftsQuery = useQuery({
    queryKey: ["drafts", "pending"],
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
    queryKey: ["material-chunks", selectedMaterial?.id],
    queryFn: () => apiGet<MaterialChunk[]>(`/materials/${selectedMaterial?.id}/chunks`),
    enabled: Boolean(selectedMaterial?.id)
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
      setFeedbackMessage(`已完成导入：${result.material.title}`);
      setForm(defaultFormState);
      setSelectedMaterialId(result.material.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["materials"] }),
        queryClient.invalidateQueries({ queryKey: ["drafts"] }),
        queryClient.invalidateQueries({ queryKey: ["material-chunks"] }),
        queryClient.invalidateQueries({ queryKey: ["knowledge"] })
      ]);
    },
    onError: (error: Error) => {
      setFeedbackMessage(error.message);
    }
  });

  const approveDraftMutation = useMutation({
    mutationFn: (draftId: string) => apiPost<DraftApproveResponse>(`/drafts/${draftId}/approve`),
    onSuccess: async () => {
      setFeedbackMessage("草稿已写入知识库。");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["drafts"] }),
        queryClient.invalidateQueries({ queryKey: ["knowledge"] })
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
      setFeedbackMessage("草稿已拒绝。");
      await queryClient.invalidateQueries({ queryKey: ["drafts"] });
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

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Study Workbench</p>
        <h2>网页版最小闭环</h2>
        <p className="lede">
          先在浏览器里完成一条最小可演示路径：录入学习资料、生成沉淀草稿、审批写入知识库。
        </p>
      </div>

      <div className="dashboard-grid">
        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">Create Material</p>
              <h3>录入学习资料</h3>
            </div>
            <span className="pill">{form.sourceType === "note" ? "手动笔记" : "URL"}</span>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>标题</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="例如：LangGraph persistence 笔记"
              />
            </label>

            <label className="field">
              <span>输入类型</span>
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
                <option value="note">手动笔记</option>
                <option value="url">URL</option>
              </select>
            </label>

            {form.sourceType === "note" ? (
              <label className="field">
                <span>正文</span>
                <textarea
                  required
                  rows={10}
                  value={form.rawText}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rawText: event.target.value }))
                  }
                  placeholder="把你正在学习的内容贴进来。"
                />
              </label>
            ) : (
              <label className="field">
                <span>URL</span>
                <input
                  required
                  type="url"
                  value={form.sourceUri}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sourceUri: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>
            )}

            <label className="field">
              <span>主题提示</span>
              <input
                value={form.topicHint}
                onChange={(event) =>
                  setForm((current) => ({ ...current, topicHint: event.target.value }))
                }
                placeholder="例如：agent memory"
              />
            </label>

            <div className="action-row">
              <button className="button-primary" type="submit" disabled={createMaterialMutation.isPending}>
                {createMaterialMutation.isPending ? "导入中..." : "导入并生成草稿"}
              </button>
              {feedbackMessage ? <p className="status-text">{feedbackMessage}</p> : null}
            </div>
          </form>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="card-label">Materials</p>
              <h3>最近资料</h3>
            </div>
            <span className="pill">
              {materialsQuery.data?.length ?? 0} items
            </span>
          </div>

          <div className="stack-list">
            {materialsQuery.isLoading ? <p className="muted">正在加载资料...</p> : null}
            {materialsQuery.data?.map((material) => (
              <button
                key={material.id}
                type="button"
                className={`list-card ${selectedMaterial?.id === material.id ? "is-active" : ""}`}
                onClick={() => setSelectedMaterialId(material.id)}
              >
                <strong>{material.title}</strong>
                <span>{material.topic_hint || "未设置主题"}</span>
                <span>
                  {material.parse_status} · {formatTime(material.imported_at)}
                </span>
              </button>
            ))}
            {!materialsQuery.isLoading && !materialsQuery.data?.length ? (
              <p className="muted">还没有资料，先录入一条手动笔记试试。</p>
            ) : null}
          </div>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">Current Material</p>
              <h3>解析结果与分块</h3>
            </div>
            {selectedMaterial ? <span className="pill">{selectedMaterial.language || "unknown"}</span> : null}
          </div>

          {!selectedMaterial ? (
            <p className="muted">选择一条资料后，这里会显示解析后的正文和 chunk。</p>
          ) : (
            <div className="stack-list">
              <div className="detail-panel">
                <h4>{selectedMaterial.title}</h4>
                <p className="muted">
                  {selectedMaterial.source_type} · {selectedMaterial.parse_status}
                  {selectedMaterial.parse_error ? ` · ${selectedMaterial.parse_error}` : ""}
                </p>
                <p>{selectedMaterial.normalized_text || selectedMaterial.raw_text || "暂无正文"}</p>
              </div>

              <div className="detail-panel">
                <h4>Chunks</h4>
                {chunksQuery.isLoading ? <p className="muted">正在加载 chunks...</p> : null}
                {chunksQuery.data?.map((chunk) => (
                  <div key={chunk.id} className="chunk-card">
                    <span className="pill subtle">#{chunk.chunk_index + 1}</span>
                    <p>{chunk.content}</p>
                  </div>
                ))}
                {!chunksQuery.isLoading && !chunksQuery.data?.length ? (
                  <p className="muted">这条资料还没有可展示的 chunk。</p>
                ) : null}
              </div>
            </div>
          )}
        </article>

        <article className="card card-tall">
          <div className="section-heading">
            <div>
              <p className="card-label">Distill Drafts</p>
              <h3>待审批草稿</h3>
            </div>
            <span className="pill">{selectedMaterialDrafts.length} drafts</span>
          </div>

          <div className="stack-list">
            {!selectedMaterial ? (
              <p className="muted">先选择一条资料，再查看这条资料生成的草稿。</p>
            ) : null}
            {selectedMaterialDrafts.map((draft) => (
              <article key={draft.id} className="detail-panel">
                <div className="draft-header">
                  <div>
                    <h4>{draft.title}</h4>
                    <p className="muted">
                      {draft.status} · {formatTime(draft.updated_at)}
                    </p>
                  </div>
                  <div className="action-row compact">
                    <button
                      type="button"
                      className="button-primary"
                      disabled={approveDraftMutation.isPending || draft.status !== "pending"}
                      onClick={() => approveDraftMutation.mutate(draft.id)}
                    >
                      保存到知识库
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={rejectDraftMutation.isPending || draft.status !== "pending"}
                      onClick={() => rejectDraftMutation.mutate(draft.id)}
                    >
                      拒绝
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
              <p className="muted">这条资料暂时还没有待审批草稿。</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
