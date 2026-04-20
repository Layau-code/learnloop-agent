"use client";

import { Locale } from "@/lib/i18n/messages";

const localeOptions: Array<{ value: Locale; shortLabel: string }> = [
  { value: "zh-CN", shortLabel: "中文" },
  { value: "en", shortLabel: "EN" }
];

type LocaleSwitcherProps = {
  locale: Locale;
  onSelect: (locale: Locale) => void;
  labels?: Partial<Record<Locale, string>>;
};

export function LocaleSwitcher({ locale, onSelect, labels }: LocaleSwitcherProps) {
  return (
    <div className="locale-actions">
      {localeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`locale-button ${locale === option.value ? "is-active" : ""}`}
          onClick={() => onSelect(option.value)}
        >
          {labels?.[option.value] ?? option.shortLabel}
        </button>
      ))}
    </div>
  );
}
