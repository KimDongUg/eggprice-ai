import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "데이터 출처 — 슬기알이 수집·활용하는 공공 데이터",
  description:
    "슬기알 AI 예측에 사용되는 데이터 출처를 공개합니다. KAMIS 도매가, aT 사료가격, 한국은행 환율, 검역본부 AI 현황, 기상청 기온, KATI 수입 데이터.",
};

const DATA_SOURCES = [
  {
    icon: "📊",
    name: "KAMIS (농산물유통정보)",
    org: "한국농수산식품유통공사",
    url: "https://www.kamis.or.kr",
    data: "전국 5대 도시 계란 도매 유통가격",
    frequency: "매일 (공휴일 제외)",
    description:
      "서울, 부산, 대구, 광주, 대전의 계란 등급별(왕란·특란·대란·중란·소란) 도매 유통가격을 매일 수집합니다. 30개(한 판) 기준 원 단위로 제공되며, 슬기알의 가격 예측 및 정확도 평가의 기본 데이터입니다.",
  },
  {
    icon: "🌾",
    name: "aT (농산물유통정보)",
    org: "한국농수산식품유통공사",
    url: "https://at.or.kr",
    data: "배합사료 가격",
    frequency: "주 1회",
    description:
      "산란계용 배합사료의 가격 정보를 수집합니다. 사료비는 계란 생산 원가의 60~70%를 차지하는 핵심 변수로, 가격 변동 예측에 중요한 선행 지표 역할을 합니다.",
  },
  {
    icon: "💱",
    name: "한국은행 경제통계시스템",
    org: "한국은행",
    url: "https://ecos.bok.or.kr",
    data: "원/달러 환율 기준율",
    frequency: "매일",
    description:
      "원/달러 환율 기준율을 매일 수집합니다. 사료 원료(옥수수, 대두박)의 대부분을 수입에 의존하는 한국 축산업 특성상, 환율 변동은 생산 원가에 직접적인 영향을 미칩니다.",
  },
  {
    icon: "🐔",
    name: "국가가축방역시스템",
    org: "농림축산검역본부",
    url: "https://www.kahis.go.kr",
    data: "조류인플루엔자(AI) 발생 현황",
    frequency: "실시간",
    description:
      "고병원성 조류인플루엔자(HPAI) 발생 및 살처분 현황을 수집합니다. AI 발생은 산란계 수수 급감을 초래하여 계란 공급에 가장 큰 돌발 변수로 작용합니다.",
  },
  {
    icon: "🌡️",
    name: "기상청 기상자료개방포털",
    org: "기상청 (KMA)",
    url: "https://data.kma.go.kr",
    data: "전국 평균 기온·최고·최저 기온",
    frequency: "매일",
    description:
      "기온 데이터를 수집하여 산란율 변동과 계절적 수요 패턴을 분석합니다. 한파(저온) 시 난방비 증가와 산란율 저하, 폭염(고온) 시 닭의 스트레스로 인한 산란율 감소 등을 반영합니다.",
  },
  {
    icon: "🚢",
    name: "KATI (농식품수출정보)",
    org: "한국농수산식품유통공사",
    url: "https://www.kati.net",
    data: "계란 수입량·수입단가",
    frequency: "월 1회",
    description:
      "월별 계란 수입 물량(kg)과 수입 단가(USD)를 수집합니다. 국내 공급 부족 시 긴급 수입이 가격 안정에 미치는 영향을 분석하고, 해외 수급 동향을 예측에 반영합니다.",
  },
  {
    icon: "📦",
    name: "다봄 (축산유통정보)",
    org: "축산물품질평가원",
    url: "https://www.ekapepia.com",
    data: "일일 거래량",
    frequency: "매일",
    description:
      "전국 축산물 도매시장의 일일 계란 거래량을 수집합니다. 거래량 변동은 수요·공급 균형을 파악하는 데 중요한 지표이며, 가격 변동의 선행 신호를 감지하는 데 활용됩니다.",
  },
];

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">데이터 출처</h1>
        <p className="text-muted-foreground text-sm">
          슬기알 AI 가격 예측에 사용되는 데이터의 출처·수집 주기·활용 방법을 공개합니다.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          <p>
            슬기알은 투명한 데이터 운영을 원칙으로 합니다. 모든 데이터는 정부 기관 및 공인 기관이 공개하는
            공공 데이터를 수집·가공하여 사용하며, 자체적으로 데이터를 조작하거나 변형하지 않습니다.
            수집된 데이터는 LSTM 딥러닝 모델의 입력 변수로 활용되어 가격 예측에 반영됩니다.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {DATA_SOURCES.map((source) => (
          <Card key={source.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{source.icon}</span>
                {source.name}
                <Badge variant="outline" className="text-[10px] ml-auto">{source.frequency}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{source.org}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-foreground mb-1">{source.data}</p>
              <p className="text-sm text-muted-foreground">{source.description}</p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-primary-400 hover:underline"
              >
                {source.url}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
