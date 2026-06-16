import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ToastContainer } from "@/components/Toast";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Cureel — アニメ視聴計画",
  description: "クールごとにアニメを計画・記録・振り返る個人向けWebアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <Header />
        <main className="flex-1">{children}</main>
        <ToastContainer />
        <Analytics />
      </body>
    </html>
  );
}
