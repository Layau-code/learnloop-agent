import "./globals.css";

import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LearnLoop Agent",
  description: "Single-user local-first learning workflow agent for material ingestion, study QA, and knowledge distillation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
