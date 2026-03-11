import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI 예측 모델 설명 — LSTM 기반 계란 가격 예측",
  description:
    "슬기알의 AI 가격 예측 모델(LSTM)의 작동 원리, 입력 변수, 예측 기간, 정확도 평가 방법을 상세히 설명합니다.",
  keywords: [
    "LSTM 가격 예측",
    "계란 가격 AI",
    "머신러닝 시계열 예측",
    "딥러닝 가격 예측",
  ],
};

export default function AIModelPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI 예측 모델 설명</h1>
        <p className="text-muted-foreground text-sm">
          슬기알이 어떻게 계란 가격을 예측하는지 기술적으로 설명합니다.
        </p>
      </div>

      {/* Model overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🧠</span>
            LSTM (Long Short-Term Memory) 모델
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            슬기알은 <strong className="text-foreground">LSTM(장단기 기억 신경망)</strong> 딥러닝 모델을 사용하여
            계란 가격을 예측합니다. LSTM은 시계열 데이터 분석에 특화된 순환 신경망(RNN)의 변형으로,
            과거 데이터의 장기적·단기적 패턴을 모두 학습할 수 있는 것이 특징입니다.
          </p>
          <p>
            전통적인 통계 모델(ARIMA 등)과 달리, LSTM은 여러 변수 간의 복잡한 비선형 관계를 학습할 수 있어
            계란 가격처럼 사료가·환율·계절성·돌발 변수가 복합적으로 작용하는 시장에 적합합니다.
          </p>
        </CardContent>
      </Card>

      {/* Input variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📥</span>
            입력 변수 (16개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            모델은 다음 16개의 시장 변수를 입력받아 종합적으로 가격을 예측합니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { category: "가격 데이터", items: ["도매 유통가격 (종속변수)", "가격 이동평균 (7일/30일)", "가격 변동률"] },
              { category: "사료·원가", items: ["배합사료 가격", "원/달러 환율"] },
              { category: "수급·유통", items: ["일일 거래량", "계란 수입량", "계란 수입단가"] },
              { category: "외부 환경", items: ["조류인플루엔자 발생 여부", "평균 기온", "최고/최저 기온"] },
              { category: "시간 특성", items: ["요일 (one-hot)", "월 (계절성)", "명절 더미 변수"] },
            ].map((group) => (
              <div key={group.category} className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">{group.category}</h4>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-primary-400 rounded-full shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prediction periods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📅</span>
            예측 기간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { period: "7일", badge: "FREE", desc: "단기 구매 타이밍 판단" },
              { period: "14일", badge: "Standard", desc: "2주 수급 전망" },
              { period: "30일", badge: "Standard", desc: "월간 재고 전략 수립" },
              { period: "60일", badge: "Pro", desc: "중기 시장 방향성 판단" },
            ].map((item) => (
              <div key={item.period} className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-foreground">{item.period}</p>
                <Badge variant="outline" className="text-[10px] my-1">{item.badge}</Badge>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            예측 기간이 길어질수록 불확실성이 높아지므로, 7일 예측의 정확도가 가장 높고
            60일 예측은 방향성(상승/하락) 참고용으로 활용하시는 것이 좋습니다.
          </p>
        </CardContent>
      </Card>

      {/* Training & Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🔄</span>
            학습 및 평가
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h4 className="font-semibold text-foreground mb-1">자동 재훈련</h4>
            <p>
              모델은 매월 자동으로 재훈련됩니다. 최신 가격 데이터, 사료가 변동, 계절적 패턴 변화 등을
              반영하여 예측 성능을 유지합니다.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">평가 지표</h4>
            <ul className="space-y-1.5 mt-2">
              <li className="flex items-start gap-2">
                <Badge className="bg-blue-50 text-blue-600 text-[10px] shrink-0 mt-0.5">MAPE</Badge>
                <span>평균 절대 백분율 오차 — 예측과 실제의 평균적 차이 (%)</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-green-50 text-green-600 text-[10px] shrink-0 mt-0.5">RMSE</Badge>
                <span>평균 제곱근 오차 — 큰 오차에 더 민감한 지표 (원)</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-orange-50 text-orange-600 text-[10px] shrink-0 mt-0.5">MAE</Badge>
                <span>평균 절대 오차 — 예측 오차의 평균 크기 (원)</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge className="bg-purple-50 text-purple-600 text-[10px] shrink-0 mt-0.5">방향 정확도</Badge>
                <span>상승/하락 방향 적중률 (%)</span>
              </li>
            </ul>
          </div>
          <p>
            실시간 정확도 지표는{" "}
            <Link href="/accuracy" className="text-primary-400 hover:underline">
              예측 정확도 페이지
            </Link>
            에서 투명하게 공개하고 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* Confidence interval */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📐</span>
            신뢰구간
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed">
          <p>
            모든 예측 결과에는 신뢰구간(Confidence Interval)이 함께 제공됩니다.
            신뢰구간은 실제 가격이 해당 범위 안에 있을 확률을 나타내며,
            예측의 불확실성을 정량적으로 표현합니다.
          </p>
          <p className="mt-2">
            예를 들어, "특란 7일 후 예측가 7,200원 (신뢰구간: 6,984원 ~ 7,416원)"이라면,
            7일 후 실제 가격이 6,984원에서 7,416원 사이에 있을 가능성이 높다는 의미입니다.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-5 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground mb-2">면책 사항</h4>
          <p>
            AI 예측은 과거 데이터 패턴에 기반한 통계적 추정치이며, 미래 가격을 보장하지 않습니다.
            조류인플루엔자 발생, 정부 정책 변화, 글로벌 곡물 시장 급변 등 예측 불가능한 돌발 변수에 의해
            실제 가격은 예측과 크게 달라질 수 있습니다.
            예측 정보는 의사결정의 참고 자료로만 활용하시고, 투자·거래 조언으로 해석하지 마시기 바랍니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
