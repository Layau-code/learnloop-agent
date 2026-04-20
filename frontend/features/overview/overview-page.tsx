"use client";

import { useLocale } from "@/lib/i18n/provider";

export function OverviewPage() {
  const { messages } = useLocale();
  const copy = messages.home;

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="lede">{copy.lede}</p>
      </div>

      <div className="card-grid">
        {copy.cards.map((item) => (
          <article key={item.title} className="card">
            <p className="card-label">{item.label}</p>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
