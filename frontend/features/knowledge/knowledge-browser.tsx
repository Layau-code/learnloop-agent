"use client";

import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import type { KnowledgeItem } from "@/lib/types";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function KnowledgeBrowser() {
  const [search, setSearch] = useState("");
  const queryString = useMemo(() => {
    const keyword = search.trim();
    return keyword ? `/knowledge?q=${encodeURIComponent(keyword)}` : "/knowledge";
  }, [search]);

  const knowledgeQuery = useQuery({
    queryKey: ["knowledge", search.trim()],
    queryFn: () => apiGet<KnowledgeItem[]>(queryString)
  });

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Knowledge Base</p>
        <h2>知识库浏览页</h2>
        <p className="lede">
          这里展示已经通过审批的知识条目。当前版本先支持列表、关键词搜索和正文预览。
        </p>
      </div>

      <article className="card">
        <div className="section-heading">
          <div>
            <p className="card-label">Search</p>
            <h3>按标题、主题或正文搜索</h3>
          </div>
          <span className="pill">{knowledgeQuery.data?.length ?? 0} items</span>
        </div>

        <label className="field">
          <span>关键词</span>
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="例如：agent memory / LangGraph / retrieval"
          />
        </label>
      </article>

      <div className="card-grid knowledge-grid">
        {knowledgeQuery.isLoading ? <p className="muted">正在加载知识条目...</p> : null}
        {knowledgeQuery.data?.map((item) => (
          <article key={item.id} className="card knowledge-card">
            <div className="section-heading">
              <div>
                <p className="card-label">{item.item_type}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="pill subtle">{item.topic || "general"}</span>
            </div>
            <p className="muted">
              更新于 {formatTime(item.updated_at)}
              {item.confidence_score ? ` · confidence ${item.confidence_score.toFixed(2)}` : ""}
            </p>
            {item.summary ? <p>{item.summary}</p> : null}
            <div className="markdown-preview compact">
              {item.content_md
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
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
          <p className="muted">知识库还是空的。先去 Study 页面审批一条草稿，就能在这里看到结果。</p>
        </article>
      ) : null}
    </section>
  );
}
