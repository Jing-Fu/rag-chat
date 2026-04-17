import type { Metadata } from "next";

import { Providers } from "@/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "RAG 工作區",
  description: "以本機優先為核心的 RAG 工作區，提供有依據的對話與模型操作。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
