"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/lib/i18n/provider";

const navItems = [
  { href: "/", key: "overview" },
  { href: "/knowledge", key: "knowledge" },
  { href: "/study", key: "study" },
  { href: "/reflection", key: "reflection" },
  { href: "/settings", key: "settings" }
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
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">{app.brand}</p>
            <h1>{app.title}</h1>
            <p className="sidebar-copy">{app.subtitle}</p>
          </div>
          <span className="pill">{app.mode}</span>
        </div>

        <div className="locale-switcher">
          <span className="locale-label">{app.language}</span>
          <LocaleSwitcher locale={locale} onSelect={setLocale} />
        </div>

        <nav className="nav">
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
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
