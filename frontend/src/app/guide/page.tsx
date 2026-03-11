import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "계란 지식백과 — 가격 구조·등급·유통·사료 영향",
  description:
    "계란 가격이 결정되는 구조, 특란·대란·중란 등급 차이, 유통 과정, 사료가격의 영향까지. 계란 시장을 이해하기 위한 필수 지식을 정리했습니다.",
  keywords: [
    "계란 등급 차이",
    "특란 대란 차이",
    "계란 가격 구조",
    "계란 유통 구조",
    "사료 가격 영향",
    "계란 도매가",
  ],
};

const KNOWLEDGE_SECTIONS = [
  {
    id: "price-structure",
    icon: "💰",
    title: "계란 가격은 어떻게 결정되는가?",
    content: `계란 가격은 단순히 수요와 공급에 의해서만 결정되지 않습니다. 생산 원가(사료비·인건비·시설비), 유통 단계(농가→집하장→도매시장→소매), 계절적 수요 변동, 그리고 조류인플루엔자 같은 돌발 변수가 복합적으로 작용합니다.

한국의 계란 도매 가격은 KAMIS(농산물유통정보)를 통해 매일 공시되며, 전국 5대 도시(서울, 부산, 대구, 광주, 대전)의 도매시장 유통가격을 기준으로 합니다. 도매가는 30개(한 판) 단위로 표시되며, 등급·지역·시기에 따라 가격이 다릅니다.

생산 원가 중 가장 큰 비중을 차지하는 것은 사료비로, 전체 생산 원가의 약 60~70%를 차지합니다. 따라서 옥수수·대두박 등 사료 원료 가격이 오르면 계란 가격도 상승 압력을 받게 됩니다. 환율 역시 수입 사료 원료 가격에 영향을 주므로 간접적인 가격 결정 요인입니다.`,
  },
  {
    id: "grade",
    icon: "🥚",
    title: "특란·대란·중란·소란 — 등급별 차이",
    content: `계란 등급은 무게를 기준으로 분류됩니다. 축산물 품질평가원의 기준에 따르면:

• 왕란: 68g 이상 — 가장 크고 무거운 등급. 생산량이 적어 가격이 높습니다.
• 특란: 60g 이상 68g 미만 — 가장 많이 유통되는 등급. 도매·소매 모두에서 거래량이 가장 많습니다.
• 대란: 52g 이상 60g 미만 — 특란 다음으로 유통량이 많으며, 급식·제과업체에서 선호합니다.
• 중란: 44g 이상 52g 미만 — 소규모 음식점이나 가공용으로 주로 사용됩니다.
• 소란: 44g 미만 — 초산란(어린 닭이 처음 낳는 알)이 대부분이며, 시장 유통량이 적습니다.

등급 간 가격 차이는 보통 한 판(30개) 기준 500~1,500원 정도이며, 수급 상황에 따라 격차가 벌어지기도 합니다. 특란이 가장 비싸고 소란이 가장 저렴한 것이 일반적인 구조입니다.`,
  },
  {
    id: "distribution",
    icon: "🚚",
    title: "계란 유통 구조 — 농가에서 소비자까지",
    content: `계란의 유통 경로는 크게 세 단계로 나뉩니다.

1단계: 생산(농가) → 집하장
양계 농가에서 생산된 계란은 집하장(GP센터)으로 이동합니다. GP센터에서는 세척, 검란(불량란 제거), 등급 분류, 포장이 이루어집니다. 최근에는 HACCP 인증 GP센터를 통한 유통이 의무화되고 있습니다.

2단계: 집하장 → 도매시장
포장된 계란은 도매시장이나 대형 유통업체 물류센터로 운송됩니다. 도매시장에서는 경매 또는 정가 수의매매 방식으로 거래됩니다. 이 단계의 가격이 KAMIS에서 공시하는 '도매 유통가격'입니다.

3단계: 도매시장 → 소매(소비자)
대형마트, 슈퍼마켓, 편의점, 온라인 쇼핑몰 등 소매 채널을 통해 소비자에게 도달합니다. 소매가는 도매가 대비 30~50% 정도 높게 형성되며, 유통 마진·브랜드·포장 형태에 따라 달라집니다.

최근에는 산지 직거래, 온라인 직배송 등 중간 유통 단계를 줄이는 방식도 늘어나고 있습니다.`,
  },
  {
    id: "feed",
    icon: "🌾",
    title: "사료 가격이 계란 가격에 미치는 영향",
    content: `사료비는 계란 생산 원가의 60~70%를 차지하는 핵심 변수입니다. 배합사료의 주요 원료는 옥수수(약 50%), 대두박(약 20%), 기타 첨가물(비타민, 미네랄 등)로 구성됩니다.

한국은 사료 원료의 대부분을 수입에 의존합니다. 특히 옥수수와 대두박은 미국, 브라질, 아르헨티나 등에서 수입하므로 국제 곡물 시세와 환율 변동에 직접적인 영향을 받습니다.

사료 가격 상승 → 생산 원가 증가 → 농가 출하가 인상 → 도매가 상승 → 소매가 상승

이 전달 과정은 보통 1~3개월의 시차를 두고 반영됩니다. 슬기알 AI는 이러한 시차 관계를 LSTM 모델에 학습시켜 사료 가격 변동이 향후 계란 가격에 미칠 영향을 예측합니다.

최근 3년간 사료 가격은 우크라이나 전쟁, 엘니뇨 등의 영향으로 변동 폭이 커졌으며, 이로 인해 계란 가격 변동성도 함께 높아졌습니다.`,
  },
  {
    id: "seasonal",
    icon: "📅",
    title: "계절별 가격 패턴 — 언제 계란이 비싸고 저렴한가?",
    content: `계란 가격은 뚜렷한 계절적 패턴을 보입니다.

• 1~2월 (설 명절 전): 연중 가장 비싼 시기. 설날 전 수요가 급증하며, 선물 세트·명절 음식 재료로 계란 소비가 늘어납니다. 명절 2주 전부터 가격이 오르기 시작합니다.
• 3~4월 (명절 후): 명절 수요가 빠지면서 가격이 하락합니다. 봄철 기온 상승으로 산란율도 회복되어 공급이 늘어납니다.
• 5~7월 (여름): 고온으로 닭의 산란율이 떨어져 공급이 줄고, 빙수·베이킹 수요는 유지되어 가격이 다시 소폭 상승하는 경향이 있습니다.
• 8~9월 (추석 전): 설날에 이어 두 번째로 가격이 높은 시기. 추석 명절 수요가 가격을 끌어올립니다.
• 10~12월: 추석 후 가격이 안정되며, 연말 수요가 있지만 명절만큼 급등하지는 않습니다.

이러한 계절적 패턴을 이해하면 구매 시점을 전략적으로 결정할 수 있습니다. 슬기알 AI도 이 패턴을 학습하여 예측에 반영하고 있습니다.`,
  },
  {
    id: "ai",
    icon: "🤖",
    title: "조류인플루엔자(AI)와 계란 가격",
    content: `조류인플루엔자(Avian Influenza)는 계란 가격에 가장 큰 돌발 변수 중 하나입니다. 고병원성 조류인플루엔자(HPAI)가 발생하면 감염 농장과 반경 3km 이내 농장의 가금류를 모두 살처분해야 합니다.

살처분으로 산란계(알을 낳는 닭) 사육 수수가 급감하면 공급이 줄어들고, 가격이 급등합니다. 2017년 AI 파동 때 계란 가격이 약 50% 이상 급등한 사례가 있으며, 이후에도 겨울철마다 AI 발생에 따른 가격 변동이 반복되고 있습니다.

AI 발생 → 살처분 → 산란계 감소 → 공급 부족 → 가격 급등

가격 회복까지는 보통 3~6개월이 소요됩니다. 살처분 후 새 병아리를 입식하고, 이 병아리가 산란을 시작하기까지 약 5개월이 걸리기 때문입니다.

슬기알은 검역본부의 AI 발생 현황 데이터를 실시간으로 수집하여 공급 충격 가능성을 예측에 반영합니다.`,
  },
  {
    id: "import",
    icon: "🚢",
    title: "계란 수입과 가격 영향",
    content: `한국은 계란 자급률이 약 99%로 대부분 국내 생산으로 소비를 충당합니다. 그러나 AI(조류인플루엔자) 발생 등으로 공급이 급감할 때는 긴급 수입을 통해 물량을 보충합니다.

주요 수입국은 미국, 스페인, 태국 등이며, 주로 식용란(신선란)과 가공용 액란(깬 계란)을 수입합니다. 수입 계란은 운송 기간이 길어 신선도에서 국산 대비 불리하지만, 공급 부족 시 가격 안정에 기여합니다.

수입량과 수입 단가는 KATI(농식품수출정보)를 통해 월별로 공시되며, 슬기알 AI는 이 데이터를 수집하여 해외 공급 변동이 국내 가격에 미치는 영향을 분석합니다.

최근에는 FTA(자유무역협정) 확대로 계란 관세가 단계적으로 인하되고 있어, 수입 계란의 가격 경쟁력이 높아지고 있습니다. 이는 중장기적으로 국내 계란 가격의 상한선 역할을 할 수 있습니다.`,
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">계란 지식백과</h1>
        <p className="text-muted-foreground text-sm">
          계란 가격 구조, 등급 차이, 유통 과정, 사료 영향 등 계란 시장을 이해하기 위한 필수 지식
        </p>
      </div>

      {/* TOC */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3">목차</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KNOWLEDGE_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary-400 transition-colors"
                >
                  <span>{s.icon}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Sections */}
      {KNOWLEDGE_SECTIONS.map((section) => (
        <Card key={section.id} id={section.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">{section.icon}</span>
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary-50 to-orange-50 border-primary-100">
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-bold mb-2">
            이 지식을 바탕으로 AI가 가격을 예측합니다
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            사료가, 환율, 계절 수요, AI 발생 현황, 수입 데이터 등을 종합 분석하여 7일~60일 후 가격을 예측합니다.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/prediction"
              className="inline-flex items-center px-4 py-2 bg-primary-400 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors"
            >
              AI 예측 보기
            </Link>
            <Link
              href="/accuracy"
              className="inline-flex items-center px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              예측 정확도 확인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
