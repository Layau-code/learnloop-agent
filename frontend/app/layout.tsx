import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LearnLoop Agent",
  description: "Browser-based learning workflow agent for material ingestion and knowledge distillation"
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/study", label: "Study" },
  { href: "/reflection", label: "Reflection" },
  { href: "/settings", label: "Settings" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <div className="app-shell">
            <aside className="sidebar">
              <div>
                <p className="eyebrow">LEARNLOOP</p>
                <h1>Learning Workflow Web</h1>
              </div>
              <nav className="nav">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <main className="main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
