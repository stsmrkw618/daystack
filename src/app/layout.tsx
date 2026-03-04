import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

const APP_URL = "https://daystack-eosin.vercel.app";

export const metadata: Metadata = {
  title: "DayStack β — Stack your day, own your time.",
  description: "1日の仕事をタイマーで記録し、時間の使い方を可視化するワークログアプリ",
  manifest: "/manifest.json",
  openGraph: {
    title: "DayStack β",
    description: "今日の仕事を、積み上げよう。",
    siteName: "DayStack",
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "DayStack — Stack your day, own your time.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DayStack β",
    description: "今日の仕事を、積み上げよう。",
    images: [`${APP_URL}/og-image.png`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DayStack",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4ECDC4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
