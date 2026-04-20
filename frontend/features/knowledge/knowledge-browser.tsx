"use client";

import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import { renderMarkdownPreview } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import { appQueryKeys } from "@/lib/query-keys";
import type { KnowledgeItem } from "@/lib/types";

export function KnowledgeBrowser() {
  const [search, setSearch] = useState("");
  const { messages, formatDateTime } = useLocale();
  const copy = messages.knowledge;
  const queryString = useMemo(() => {
    const keyword = search.trim();
    return keyword ? `/knowledge?q=${encodeURIComponent(keyword)}` : "/knowledge";
  }, [search]);

  const knowledgeQuery = useQuery({
    queryKey: [...appQueryKeys.knowledge(), search.trim()],
    queryFn: () => apiGet<KnowledgeItem[]>(queryString)
  });

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="lede">{copy.lede}</p>
      </div>

      <article className="card">
        <div className="section-heading">
          <div>
            <p className="card-label">{copy.searchLabel}</p>
            <h3>{copy.searchTitle}</h3>
          </div>
          <span className="pill">
            {knowledgeQuery.data?.length ?? 0} {copy.itemCount ?? ""}
          </span>
        </div>

        <label className="field">
          <span>{copy.keyword}</span>
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder={copy.keywordPlaceholder}
          />
        </label>
      </article>

      <div className="card-grid knowledge-grid">
        {knowledgeQuery.isLoading ? <p className="muted">{copy.loading}</p> : null}
        {knowledgeQuery.data?.map((item) => (
          <article key={item.id} className="card knowledge-card">
            <div className="section-heading">
              <div>
                <p className="card-label">{item.item_type}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="pill subtle">{item.topic || copy.general}</span>
            </div>
            <p className="muted">
              {copy.updatedAt} {formatDateTime(item.updated_at)}
              {item.confidence_score ? ` · ${copy.confidence} ${item.confidence_score.toFixed(2)}` : ""}
            </p>
            {item.summary ? <p>{item.summary}</p> : null}
            <div className="markdown-preview compact">
              {renderMarkdownPreview(item.content_md)
                .slice(0, 6)
                .map((line, index) => (
                  <p key={`${item.id}-${index}`}>{line}</p>
                ))}
            </div>
            {item.tags.length ? (
              <div className="tag-row">
                {item.tags.map((tag) => (
                  <span key={tag} className="pill subtle">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {!knowledgeQuery.isLoading && !knowledgeQuery.data?.length ? (
        <article className="card">
          <p className="muted">{copy.empty}</p>
        </article>
      ) : null}
    </section>
  );
}
