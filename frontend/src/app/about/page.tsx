import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "회사 소개 — 슬기알",
  description:
    "슬기알은 양계업·유통업 현장 경험과 AI 기술을 결합한 계란 가격 예측 플랫폼입니다. 정확한 데이터로 구매 의사결정을 돕습니다.",
};

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-1">슬기알 소개</h1>
        <p className="text-muted-foreground text-sm">
          계란 시장 정보 허브 플랫폼
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">서비스 목적</h2>
            <p>
              슬기알은 양계 농가, 도매상, 유통업체, 그리고 일반 소비자가 계란 가격 변동에 대한 정확한 정보를 바탕으로
              최적의 구매·판매 의사결정을 내릴 수 있도록 돕는 데이터 플랫폼입니다.
            </p>
            <p className="mt-2">
              매일 수집되는 KAMIS 도매 유통가, 사료 가격, 환율, 기상 데이터, 조류인플루엔자 현황 등을 종합 분석하여
              7일~60일 후의 가격 방향을 예측합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">팀 소개</h2>
            <p>
              슬기알 팀은 양계업 및 계란 유통 현장에서의 실무 경험과 데이터 분석·머신러닝 기술을 결합하여 서비스를 운영하고 있습니다.
              계란 시장의 특수성(계절성, AI 리스크, 사료 가격 연동 등)을 깊이 이해하고 있으며,
              이를 AI 모델에 반영하여 실용적인 예측 정보를 제공합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">데이터 출처</h2>
            <p>슬기알은 다음과 같은 공공·공인 데이터를 수집·활용합니다.</p>
            <ul className="mt-2 space-y-1.5 list-disc list-inside">
              <li>KAMIS (한국농수산식품유통공사) — 전국 계란 도매 유통가격</li>
              <li>aT (농산물유통정보) — 배합사료 가격</li>
              <li>한국은행 — 원/달러 환율 기준율</li>
              <li>검역본부 — 조류인플루엔자 발생 현황</li>
              <li>기상청 (KMA) — 전국 평균 기온</li>
              <li>KATI (농식품수출정보) — 계란 수입량·수입단가</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">AI 예측 모델</h2>
            <p>
              슬기알은 LSTM(Long Short-Term Memory) 딥러닝 모델을 사용합니다.
              16개 이상의 시장 변수를 입력받아 시계열 패턴을 학습하고, 7일·14일·30일·60일 후의 가격을 예측합니다.
              모델은 매월 자동 재훈련되며, 예측 정확도를{" "}
              <Link href="/accuracy" className="text-primary-400 hover:underline">
                예측 정확도 페이지
              </Link>
              에서 투명하게 공개하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">면책 사항</h2>
            <p>
              슬기알이 제공하는 가격 예측 정보는 통계적 추정치이며, 투자·거래에 대한 조언이 아닙니다.
              실제 시장 가격은 예측과 다를 수 있으며, 예측 정보를 기반으로 한 의사결정의 책임은 이용자에게 있습니다.
              보다 자세한 내용은{" "}
              <Link href="/terms" className="text-primary-400 hover:underline">
                이용약관
              </Link>
              을 참고해 주세요.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">문의</h2>
            <ul className="space-y-1">
              <li>이메일: <a href="mailto:kduaro124@naver.com" className="text-primary-400 hover:underline">kduaro124@naver.com</a></li>
              <li>전화: <a href="tel:010-3526-4754" className="text-primary-400 hover:underline">010-3526-4754</a></li>
            </ul>
            <p className="mt-2">
              서비스 이용 중 문의사항이 있으시면{" "}
              <Link href="/contact" className="text-primary-400 hover:underline">
                문의 페이지
              </Link>
              를 이용해 주세요. 영업일 기준 1~2일 이내 답변드립니다.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
