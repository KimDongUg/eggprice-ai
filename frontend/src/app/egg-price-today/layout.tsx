import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘 계란 가격 | 특란 30구 서울 시세와 AI 전망 - 슬기알",
  description:
    "오늘 계란 가격을 확인하세요. 특란 30구 서울 기준 도매 시세, 전일 대비 변동, 최근 추이, 시장 해설과 AI 전망까지 슬기알에서 한눈에 제공합니다.",
  keywords: [
    "오늘 계란 가격",
    "계란 시세",
    "계란값 오늘",
    "특란 30구 가격",
    "서울 계란 가격",
    "계란 도매가",
    "계란값",
    "달걀 가격",
    "계란 가격 추이",
    "계란 가격 전망",
  ],
  openGraph: {
    title: "오늘 계란 가격 | 특란 30구 서울 시세 - 슬기알",
    description:
      "특란 30구 서울 도매 시세, 전일 대비 변동, 7일·30일 추이 그래프, 시장 해설까지 한눈에.",
    type: "website",
  },
};

export default function EggPriceTodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
