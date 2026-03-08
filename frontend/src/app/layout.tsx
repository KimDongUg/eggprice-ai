import type { Metadata } from "next";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import Providers from "@/components/providers";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eggprice.kr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "슬기알 - 출하 시점을 결정하는 가격 방향성 브리핑",
    template: "%s | 슬기알(계란가격예측 AI)",
  },
  description:
    "15년 업계 실무 경험 + AI 분석 기반 계란 가격 방향성 브리핑 서비스. 출하 권장 시점, 주간 리포트, 급등락 알림을 제공합니다. 양계 농가·도매상·유통업체를 위한 의사결정 도구.",
  keywords: [
    "계란 가격 예측",
    "달걀 시세",
    "계란 출하 시점",
    "계란 도매 가격",
    "양계 농가",
    "계란 유통",
    "슬기알",
    "계란가격예측 AI",
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
    siteName: "슬기알(계란가격예측 AI)",
    title: "슬기알 - 출하 시점을 결정하는 가격 방향성 브리핑",
    description:
      "15년 업계 실무 경험 + AI 분석 기반 계란 가격 방향성 브리핑 서비스. 출하 권장 시점, 주간 리포트, 급등락 알림을 제공합니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "슬기알 - 출하 시점을 결정하는 가격 방향성 브리핑",
    description:
      "15년 업계 실무 경험 + AI 분석 기반 계란 가격 방향성 브리핑 서비스. 양계 농가·도매상·유통업체를 위한 의사결정 도구.",
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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
