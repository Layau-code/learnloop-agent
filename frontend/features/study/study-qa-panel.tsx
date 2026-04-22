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
  isLoadingMessages: boolean;
  messages: ChatMessage[];
  formatTime: (value: string) => string;
  onSaveAnswer: (messageId: string) => void;
  savingAnswerMessageId: string | null;
  savedAnswerMessageIds: string[];
};

type MessageLine = {
  text: string;
  variant: "paragraph" | "bullet";
};

function getReadableMessageLines(content: string): MessageLine[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line): MessageLine[] => {
      const headingText = line.replace(/^#{1,6}\s+/, "").trim();
      if (/^(回答|依据片段|参考|引用|sources?)$/i.test(headingText)) {
        return [];
      }
      if (/^-\s*chunk\s+\d+/i.test(line) || /^chunk\s+\d+/i.test(line)) {
        return [];
      }
      if (line.startsWith("- ")) {
        return [{ text: line.slice(2).trim(), variant: "bullet" }];
      }
      return [{ text: headingText, variant: "paragraph" }];
    });
}

export function StudyQaPanel({
  selectedMaterial,
  question,
  onQuestionChange,
  onSubmit,
  isSubmitting,
  isLoadingMessages,
  messages,
  formatTime,
  onSaveAnswer,
  savingAnswerMessageId,
  savedAnswerMessageIds
}: StudyQaPanelProps) {
  const { messages: appMessages } = useLocale();
  const copy = appMessages.study;
  const savedAnswerSet = new Set(savedAnswerMessageIds);

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
            {messages.map((message) => {
              const readableLines = getReadableMessageLines(message.content_md);
              const isAssistant = message.role === "assistant";
              const isSavedAnswer = savedAnswerSet.has(message.id);
              const isSavingAnswer = savingAnswerMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`message-card ${isAssistant ? "is-assistant" : "is-user"}`}
                >
                  <div className="message-meta">
                    <span className="turn-role">{isAssistant ? copy.agent : copy.you}</span>
                    <span className="turn-time">{formatTime(message.created_at)}</span>
                  </div>
                  <div className="message-body">
                    {readableLines.map((line, index) =>
                      line.variant === "bullet" ? (
                        <p key={`${message.id}-${index}`} className="message-bullet">
                          {line.text}
                        </p>
                      ) : (
                        <p key={`${message.id}-${index}`}>{line.text}</p>
                      )
                    )}
                  </div>
                  {message.citations_json.length ? (
                    <div className="message-sources">
                      <span>{copy.chunk}</span>
                      {message.citations_json.map((citation, index) => {
                        const chunkIndex =
                          typeof citation.chunk_index === "number" ? citation.chunk_index + 1 : null;
                        return (
                          <span key={`${message.id}-citation-${index}`} className="source-chip">
                            {chunkIndex ?? index + 1}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  {isAssistant ? (
                    <div className="message-actions">
                      <button
                        type="button"
                        className="message-action"
                        disabled={isSavingAnswer || isSavedAnswer}
                        onClick={() => onSaveAnswer(message.id)}
                      >
                        {isSavedAnswer
                          ? copy.answerDraftSavedShort
                          : isSavingAnswer
                            ? copy.savingAnswerDraft
                            : copy.saveAnswerDraft}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
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
              <span />
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
