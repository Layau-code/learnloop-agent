import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MyAgent",
  description: "Learning knowledge distillation agent scaffold"
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
                <p className="eyebrow">MYAGENT</p>
                <h1>Learning OS Scaffold</h1>
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

