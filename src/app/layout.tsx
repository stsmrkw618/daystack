import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "DayStack β — Stack your day, own your time.",
  description: "1日の仕事をタイマーで記録し、時間の使い方を可視化するワークログアプリ",
  openGraph: {
    title: "DayStack β",
    description: "今日の仕事を、積み上げよう。",
    siteName: "DayStack",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
