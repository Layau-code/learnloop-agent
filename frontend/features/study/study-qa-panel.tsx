"use client";

import { FormEvent } from "react";

import { useLocale } from "@/lib/i18n/provider";
import type { ChatMessage, Material } from "@/lib/types";

type StudyQaPanelProps = {
  selectedMaterial: Material | null;
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  effectiveThreadId: string | null;
  isLoadingMessages: boolean;
  messages: ChatMessage[];
  formatTime: (value: string) => string;
  renderMarkdownPreview: (content: string) => string[];
};

export function StudyQaPanel({
  selectedMaterial,
  question,
  onQuestionChange,
  onSubmit,
  isSubmitting,
  effectiveThreadId,
  isLoadingMessages,
  messages,
  formatTime,
  renderMarkdownPreview
}: StudyQaPanelProps) {
  const { messages: appMessages } = useLocale();
  const copy = appMessages.study;

  return (
    <article className="card card-tall">
      <div className="section-heading">
        <div>
          <p className="card-label">{copy.qaLabel}</p>
          <h3>{copy.qaTitle}</h3>
        </div>
        {selectedMaterial ? <span className="pill subtle">{selectedMaterial.title}</span> : null}
      </div>

      {!selectedMaterial ? (
        <p className="muted">{copy.qaEmpty}</p>
      ) : (
        <div className="stack-list">
          <form className="stack-form" onSubmit={onSubmit}>
            <label className="field">
              <span>{copy.qaQuestion}</span>
              <textarea
                required
                rows={4}
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                placeholder={copy.qaPlaceholder}
              />
            </label>
            <div className="action-row">
              <button className="button-primary" type="submit" disabled={isSubmitting || !question.trim()}>
                {isSubmitting ? copy.answering : copy.ask}
              </button>
              {effectiveThreadId ? <span className="pill subtle">{copy.threadReady}</span> : null}
            </div>
          </form>

          <div className="detail-panel">
            <h4>{copy.qaHistoryTitle}</h4>
            {isLoadingMessages ? <p className="muted">{copy.qaLoading}</p> : null}
            {messages.map((message) => (
              <div key={message.id} className="message-card">
                <div className="message-meta">
                  <span className={`pill ${message.role === "assistant" ? "" : "subtle"}`}>
                    {message.role === "assistant" ? copy.agent : copy.you}
                  </span>
                  <span className="muted">{formatTime(message.created_at)}</span>
                </div>
                <div className="markdown-preview compact">
                  {renderMarkdownPreview(message.content_md).map((line, index) => (
                    <p key={`${message.id}-${index}`}>{line}</p>
                  ))}
                </div>
                {message.citations_json.length ? (
                  <div className="tag-row">
                    {message.citations_json.map((citation, index) => {
                      const chunkIndex =
                        typeof citation.chunk_index === "number" ? citation.chunk_index + 1 : null;
                      return (
                        <span key={`${message.id}-citation-${index}`} className="pill subtle">
                          {chunkIndex ? `${copy.chunk} ${chunkIndex}` : copy.chunk}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
            {!isLoadingMessages && !messages.length ? (
              <p className="muted">{copy.qaNoMessages}</p>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
