"use client";

import { useLocale } from "@/lib/i18n/provider";

export function ReflectionShell() {
  const { messages } = useLocale();
  const copy = messages.reflection;

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="lede">{copy.lede}</p>
      </div>
    </section>
  );
}
