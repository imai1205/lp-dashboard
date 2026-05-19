import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LP Analytics | ダッシュボード",
  description: "ランディングページの成果を可視化するSaaSダッシュボード",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
