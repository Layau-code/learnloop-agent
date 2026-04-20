"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/lib/i18n/provider";

export function SettingsPanel() {
  const { locale, setLocale, messages } = useLocale();
  const copy = messages.settings;

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p className="lede">{copy.lede}</p>
      </div>

      <div className="dashboard-grid">
        <article className="card">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.languageTitle}</p>
              <h3>{copy.languageTitle}</h3>
            </div>
          </div>
          <p className="lede">{copy.languageDescription}</p>
          <div className="settings-locale-actions">
            <LocaleSwitcher locale={locale} onSelect={setLocale} labels={{ "zh-CN": copy.zh, en: copy.en }} />
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <div>
              <p className="card-label">{copy.modeTitle}</p>
              <h3>{copy.modeTitle}</h3>
            </div>
            <span className="pill">Local-first</span>
          </div>
          <p>{copy.modeDescription}</p>
        </article>
      </div>
    </section>
  );
}
