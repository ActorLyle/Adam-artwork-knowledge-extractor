import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "亚当范画知识提取器 · 编辑部工作台",
  description: "从遮挡版范画提取考点，并生成小红书运营笔记。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
