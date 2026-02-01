import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/providers";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eggprice.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "계란가격 예측(EggPrice AI)",
    template: "%s | 계란가격 예측(EggPrice AI)",
  },
  description:
    "LSTM 기반 AI가 분석하는 계란 가격 예측 서비스. 7일/14일/30일 가격 전망, 시장 요인 분석, 맞춤 알림을 제공합니다.",
  keywords: [
    "계란 가격",
    "계란 가격 예측",
    "달걀 시세",
    "AI 가격 예측",
    "축산물 시세",
    "KAMIS",
    "농산물 유통정보",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "계란가격 예측(EggPrice AI)",
    title: "계란가격 예측(EggPrice AI)",
    description:
      "LSTM 기반 AI가 분석하는 계란 가격 예측 서비스. 7일/14일/30일 가격 전망, 시장 요인 분석, 맞춤 알림을 제공합니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "계란가격 예측(EggPrice AI)",
    description:
      "LSTM 기반 AI가 분석하는 계란 가격 예측 서비스. 7일/14일/30일 가격 전망, 시장 요인 분석, 맞춤 알림을 제공합니다.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
