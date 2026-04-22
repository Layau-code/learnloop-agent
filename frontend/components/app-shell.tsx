"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/lib/i18n/provider";

const navItems = [
  { href: "/study", key: "study" },
  { href: "/knowledge", key: "knowledge" },
  { href: "/reflection", key: "reflection" }
] as const;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { locale, setLocale, messages } = useLocale();
  const app = messages.app;

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

          <nav className="nav" aria-label={app.navigation}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const label = app.nav[item.key];
              return (
                <Link key={item.href} href={item.href} className={isActive ? "is-active" : undefined}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-actions">
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
