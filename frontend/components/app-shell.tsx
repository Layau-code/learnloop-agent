"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/lib/i18n/provider";

const primaryItems = [
  { href: "/study", key: "study", icon: "○" },
  { href: "/knowledge", key: "knowledge", icon: "⌕" },
  { href: "/reflection", key: "reflection", icon: "◷" }
] as const;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { locale, setLocale, messages } = useLocale();
  const app = messages.app;
  const shellCopy =
    locale === "zh-CN"
      ? {
          projects: "项目",
          chats: "聊天",
          noChats: "暂无聊天",
          localProject: "LearnLoop Agent",
          currentFlow: "当前学习流",
          shortcuts: ["专注", "整理", "新建"]
        }
      : {
          projects: "Projects",
          chats: "Chats",
          noChats: "No chats yet",
          localProject: "LearnLoop Agent",
          currentFlow: "Current flow",
          shortcuts: ["Focus", "Sort", "New"]
        };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {app.skipToContent}
      </a>
      <aside className="app-sidebar">
        <div className="sidebar-top">
          <Link href="/study" className="brand-mark" aria-label={app.title}>
            {app.brand}
          </Link>

          <nav className="nav primary-nav" aria-label={app.navigation}>
            {primaryItems.map((item) => {
              const isActive = pathname === item.href;
              const label = app.nav[item.key];
              return (
                <Link key={item.href} href={item.href} className={isActive ? "is-active" : undefined}>
                  <span className="nav-glyph" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <section className="sidebar-section" aria-label={shellCopy.projects}>
            <div className="sidebar-section-header">
              <span>{shellCopy.projects}</span>
              <div className="sidebar-tools" aria-hidden="true">
                <span>⌙</span>
                <span>≡</span>
                <span>▱</span>
              </div>
            </div>
            <Link href="/study" className="sidebar-row is-current">
              <span className="row-icon" aria-hidden="true">
                ▱
              </span>
              <span>{shellCopy.localProject}</span>
            </Link>
            <Link href="/study" className="sidebar-row">
              <span className="row-icon" aria-hidden="true">
                ▱
              </span>
              <span>{shellCopy.currentFlow}</span>
            </Link>
          </section>

          <section className="sidebar-section" aria-label={shellCopy.chats}>
            <div className="sidebar-section-header">
              <span>{shellCopy.chats}</span>
              <div className="sidebar-tools" aria-hidden="true">
                <span>≡</span>
                <span>✎</span>
              </div>
            </div>
            <p className="sidebar-empty">{shellCopy.noChats}</p>
          </section>
        </div>

        <div className="sidebar-actions">
          <div className="sidebar-shortcuts" aria-hidden="true">
            {shellCopy.shortcuts.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <details className="menu-popover">
            <summary>{app.language}</summary>
            <div className="menu-panel">
              <LocaleSwitcher locale={locale} onSelect={setLocale} />
            </div>
          </details>
          <Link href="/settings" className="quiet-link">
            {app.nav.settings}
          </Link>
        </div>
      </aside>
      <main id="main-content" className="main">
        {children}
      </main>
    </div>
  );
}
