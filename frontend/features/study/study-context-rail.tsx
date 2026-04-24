"use client";

import { FormEvent } from "react";

import { renderMarkdownPreview } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import type { DistillDraft, Material, MaterialChunk } from "@/lib/types";

type SourceType = "note" | "url";

type MaterialFormState = {
  title: string;
  sourceType: SourceType;
  sourceUri: string;
  rawText: string;
  topicHint: string;
};

type StudyContextRailProps = {
  materials: Material[];
  selectedMaterial: Material | null;
  isLoadingMaterials: boolean;
  visibleDrafts: DistillDraft[];
  chunks: MaterialChunk[];
  isLoadingChunks: boolean;
  form: MaterialFormState;
  feedbackMessage: string | null;
  isCreatingMaterial: boolean;
  isApprovingDraft: boolean;
  isRejectingDraft: boolean;
  formatTime: (value: string) => string;
  onFormChange: (updater: (current: MaterialFormState) => MaterialFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectMaterial: (materialId: string) => void;
  onApproveDraft: (draftId: string) => void;
  onRejectDraft: (draftId: string) => void;
};

export function StudyContextRail({
  materials,
  selectedMaterial,
  isLoadingMaterials,
  visibleDrafts,
  chunks,
  isLoadingChunks,
  form,
  feedbackMessage,
  isCreatingMaterial,
  isApprovingDraft,
  isRejectingDraft,
  formatTime,
  onFormChange,
  onSubmit,
  onSelectMaterial,
  onApproveDraft,
  onRejectDraft
}: StudyContextRailProps) {
  const { messages } = useLocale();
  const copy = messages.study;

  return (
    <aside className="study-context-rail" aria-label={copy.currentMaterialTitle}>
      <details className="context-panel" open>
        <summary>
          <span>{copy.materialsTitle}</span>
          <strong>{materials.length}</strong>
        </summary>
        <div className="context-panel-body stack-list">
          {isLoadingMaterials ? <p className="muted">{copy.loadingMaterials}</p> : null}
          {materials.map((material) => (
            <button
              key={material.id}
              type="button"
              className={`list-card compact ${selectedMaterial?.id === material.id ? "is-active" : ""}`}
              onClick={() => onSelectMaterial(material.id)}
            >
              <strong>{material.title}</strong>
              <span>{material.topic_hint || copy.general}</span>
            </button>
          ))}
          {!isLoadingMaterials && !materials.length ? <p className="muted">{copy.noMaterials}</p> : null}
        </div>
      </details>

      <details className="context-panel" open={!materials.length}>
        <summary>
          <span>{copy.createTitle}</span>
          <strong>{copy.importAction}</strong>
        </summary>
        <div className="context-panel-body">
          <form className="stack-form" onSubmit={onSubmit}>
            <label className="field">
              <span>{copy.titleField}</span>
              <input
                required
                value={form.title}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, title: event.target.value }))
                }
                placeholder={copy.titlePlaceholder}
              />
            </label>

            <label className="field">
              <span>{copy.sourceType}</span>
              <select
                value={form.sourceType}
                onChange={(event) =>
                  onFormChange((current) => ({
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
                  rows={7}
                  value={form.rawText}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, rawText: event.target.value }))
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
                    onFormChange((current) => ({ ...current, sourceUri: event.target.value }))
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
                  onFormChange((current) => ({ ...current, topicHint: event.target.value }))
                }
                placeholder={copy.topicHintPlaceholder}
              />
            </label>

            <div className="context-action-row">
              <button className="button-primary block" type="submit" disabled={isCreatingMaterial}>
                {isCreatingMaterial ? copy.importing : copy.importAction}
              </button>
              {feedbackMessage ? <p className="status-text">{feedbackMessage}</p> : null}
            </div>
          </form>
        </div>
      </details>

      <details className="context-panel" open={Boolean(visibleDrafts.length)}>
        <summary>
          <span>{copy.draftsTitle}</span>
          <strong>{visibleDrafts.length}</strong>
        </summary>
        <div className="context-panel-body stack-list">
          {!selectedMaterial ? <p className="muted">{copy.draftsEmptyHint}</p> : null}
          {visibleDrafts.map((draft) => (
            <article key={draft.id} className="detail-panel compact-panel">
              <div className="draft-header">
                <div>
                  <h4>{draft.title}</h4>
                  <p className="muted">
                    {draft.status} · {formatTime(draft.updated_at)}
                  </p>
                </div>
              </div>
              <div className="markdown-preview compact">
                {renderMarkdownPreview(draft.content_md)
                  .slice(0, 4)
                  .map((line, index) => (
                    <p key={`${draft.id}-${index}`}>{line}</p>
                  ))}
              </div>
              <div className="action-row compact">
                <button
                  type="button"
                  className="button-primary"
                  disabled={isApprovingDraft || draft.status !== "pending"}
                  onClick={() => onApproveDraft(draft.id)}
                >
                  {copy.approve}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={isRejectingDraft || draft.status !== "pending"}
                  onClick={() => onRejectDraft(draft.id)}
                >
                  {copy.reject}
                </button>
              </div>
            </article>
          ))}
          {selectedMaterial && !visibleDrafts.length ? <p className="muted">{copy.noDrafts}</p> : null}
        </div>
      </details>

      <details className="context-panel">
        <summary>
          <span>{copy.currentMaterialTitle}</span>
          <strong>{selectedMaterial ? chunks.length : 0}</strong>
        </summary>
        <div className="context-panel-body stack-list">
          {!selectedMaterial ? (
            <p className="muted">{copy.currentMaterialEmpty}</p>
          ) : (
            <>
              <article className="detail-panel compact-panel">
                <h4>{selectedMaterial.title}</h4>
                <p className="muted">
                  {selectedMaterial.source_type} · {selectedMaterial.parse_status}
                  {selectedMaterial.parse_error ? ` · ${selectedMaterial.parse_error}` : ""}
                </p>
                <p>{selectedMaterial.normalized_text || selectedMaterial.raw_text || copy.noBody}</p>
              </article>

              <article className="detail-panel compact-panel">
                <h4>{copy.chunksTitle}</h4>
                {isLoadingChunks ? <p className="muted">{copy.loadingChunks}</p> : null}
                {chunks.map((chunk) => (
                  <div key={chunk.id} className="chunk-card compact-card">
                    <span className="pill subtle">#{chunk.chunk_index + 1}</span>
                    <p>{chunk.content}</p>
                  </div>
                ))}
                {!isLoadingChunks && !chunks.length ? <p className="muted">{copy.noChunks}</p> : null}
              </article>
            </>
          )}
        </div>
      </details>
    </aside>
  );
}
