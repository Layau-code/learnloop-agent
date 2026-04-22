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
    <article className="chat-card">
      <div className="chat-header">
        <div>
          <p className="card-label">{copy.qaLabel}</p>
          <h3>{copy.qaTitle}</h3>
        </div>
        {selectedMaterial ? <span className="pill subtle">{selectedMaterial.title}</span> : null}
      </div>

      {!selectedMaterial ? (
        <div className="empty-state">
          <p>{copy.qaEmpty}</p>
        </div>
      ) : (
        <>
          <div className="chat-scroll">
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
              <div className="empty-state compact">
                <p>{copy.qaNoMessages}</p>
              </div>
            ) : null}
          </div>

          <form className="composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="study-question">
              {copy.qaQuestion}
            </label>
            <textarea
              id="study-question"
              required
              rows={3}
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder={copy.qaPlaceholder}
            />
            <div className="composer-actions">
              {effectiveThreadId ? <span className="pill subtle">{copy.threadReady}</span> : <span />}
              <button className="button-primary" type="submit" disabled={isSubmitting || !question.trim()}>
                {isSubmitting ? copy.answering : copy.ask}
              </button>
            </div>
          </form>
        </>
      )}
    </article>
  );
}
