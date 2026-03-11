"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Bot,
  HelpCircle,
  Database,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTodaySummary, usePriceHistory } from "@/lib/queries";

const REGION_OPTIONS = [
  { value: "seoul", label: "서울" },
  { value: "busan", label: "부산" },
  { value: "daegu", label: "대구" },
  { value: "gwangju", label: "광주" },
  { value: "daejeon", label: "대전" },
];

const FAQ_ITEMS = [
  {
    q: "오늘 계란 가격은 어디 기준인가요?",
    a: "슬기알의 계란 가격은 KAMIS(한국농수산식품유통공사)에서 제공하는 도매 유통가격 기준입니다. 전국 5대 도시(서울, 부산, 대구, 광주, 대전)의 공영도매시장에서 거래되는 실제 도매가를 반영합니다.",
  },
  {
    q: "특란 30구 가격은 어떻게 계산되나요?",
    a: "특란은 계란 한 알의 무게가 68g 이상인 것을 말하며, 30구(30개)는 도매 시장의 기본 거래 단위입니다. KAMIS에서 매일 발표하는 도매시장 경락가격(경매 낙찰가)을 기준으로 표시합니다.",
  },
  {
    q: "소비자가격과 도매가격은 왜 다른가요?",
    a: "도매가격은 도매시장에서 유통업체가 구매하는 가격이고, 소비자가격(소매가)은 마트·편의점에서 최종 소비자가 구매하는 가격입니다. 소매가에는 유통 마진, 포장비, 운송비 등이 포함되어 도매가보다 30~50% 정도 높은 것이 일반적입니다.",
  },
  {
    q: "계란 가격은 왜 매일 변하나요?",
    a: "계란은 신선식품이라 재고를 오래 보관하기 어렵고, 매일 수급 상황이 달라집니다. 산란계 마릿수, 산란율, 사료 가격, 환율, 계절 수요, 조류인플루엔자 발생 여부 등 다양한 변수가 복합적으로 작용하여 매일 가격이 변동합니다.",
  },
];

export default function EggPriceTodayPage() {
  const [region, setRegion] = useState("seoul");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: summary, isLoading } = useTodaySummary("특란", region);
  const { data: history7d } = usePriceHistory("특란", 7, true, region);
  const { data: history30d } = usePriceHistory("특란", 30, true, region);

  const price = summary?.price;
  const change = summary?.change;
  const changePct = summary?.change_pct;
  const stats = summary?.stats;
  const commentary = summary?.commentary;

  const direction =
    change === 0 || change == null ? "flat" : change > 0 ? "up" : "down";

  const chart7d = (history7d ?? [])
    .filter((d) => d.wholesale_price)
    .map((d) => ({
      date: d.date.slice(5),
      price: d.wholesale_price,
    }));

  const chart30d = (history30d ?? [])
    .filter((d) => d.wholesale_price)
    .map((d) => ({
      date: d.date.slice(5),
      price: d.wholesale_price,
    }));

  return (
    <>
      {/* Schema.org FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* ── 섹션 A: Hero 요약 카드 ── */}
        <div>
          <h1 className="text-2xl font-bold mb-1">오늘 계란 가격</h1>
          <p className="text-muted-foreground text-sm">
            KAMIS 공식 도매 유통가 기준, 매일 업데이트
          </p>

          {/* 지역 선택 */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {REGION_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRegion(r.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  region === r.value
                    ? "bg-primary-400 text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : price ? (
          <Card className="border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {summary?.date} 기준 · {summary?.region_label} · 특란 30구 도매가
              </div>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-4xl font-extrabold text-gray-900">
                  {price.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground ml-1">원</span>
                </span>
                {change != null && (
                  <Badge
                    className={`text-sm px-2 py-1 ${
                      direction === "up"
                        ? "bg-red-50 text-red-600"
                        : direction === "down"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {direction === "up" && <TrendingUp className="h-3.5 w-3.5 mr-1 inline" />}
                    {direction === "down" && <TrendingDown className="h-3.5 w-3.5 mr-1 inline" />}
                    {direction === "flat" && <Minus className="h-3.5 w-3.5 mr-1 inline" />}
                    {change > 0 ? "+" : ""}
                    {change.toLocaleString()}원 ({changePct != null ? `${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}%` : ""})
                  </Badge>
                )}
              </div>

              {/* 통계 요약 */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-muted-foreground">7일 평균</p>
                    <p className="text-sm font-bold">{stats.avg_7d?.toLocaleString() ?? "-"}원</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-muted-foreground">30일 평균</p>
                    <p className="text-sm font-bold">{stats.avg_30d?.toLocaleString() ?? "-"}원</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-muted-foreground">30일 최저</p>
                    <p className="text-sm font-bold">{stats.min_30d?.toLocaleString() ?? "-"}원</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-[10px] text-muted-foreground">30일 최고</p>
                    <p className="text-sm font-bold">{stats.max_30d?.toLocaleString() ?? "-"}원</p>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground mt-3">
                <Database className="h-3 w-3 inline mr-1" />
                출처: KAMIS(한국농수산식품유통공사)
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              오늘 가격 데이터가 아직 없습니다. 매일 오전에 업데이트됩니다.
            </CardContent>
          </Card>
        )}

        {/* ── 섹션 B: 오늘 한줄 해설 ── */}
        {commentary?.summary && (
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary-400" />
                오늘 한줄 해설
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {commentary.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── 섹션 C: 가격 차트 ── */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-400" />
            최근 계란 가격 추이
          </h2>

          {/* 7일 차트 */}
          {chart7d.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">최근 7일 추이</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart7d}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => v.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()}원`, "도매가"]}
                      />
                      {stats?.avg_7d && (
                        <ReferenceLine
                          y={stats.avg_7d}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{ value: "7일 평균", fontSize: 10, fill: "#94a3b8" }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 30일 차트 */}
          {chart30d.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">최근 30일 추이</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart30d}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => v.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v.toLocaleString()}원`, "도매가"]}
                      />
                      {stats?.avg_30d && (
                        <ReferenceLine
                          y={stats.avg_30d}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{ value: "30일 평균", fontSize: 10, fill: "#94a3b8" }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── 섹션 D: 가격 해설 본문 ── */}
        {commentary?.body && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">오늘 계란 가격 해설</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {commentary.body}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── 섹션 E: FAQ ── */}
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary-400" />
            자주 묻는 질문
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* ── 섹션 F: 내부 링크 (예측 연결) ── */}
        <Card className="bg-gradient-to-r from-primary-50 to-orange-50 border-primary-100">
          <CardContent className="py-8">
            <h2 className="text-lg font-bold mb-2 text-center">
              오늘 가격을 확인하셨다면, 앞으로의 가격도 확인해 보세요
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              슬기알 AI가 16개 시장 변수를 분석하여 7일~60일 후 가격을 예측합니다
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/prediction"
                className="flex items-center justify-center gap-1 px-4 py-3 bg-primary-400 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors"
              >
                AI 예측
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/accuracy"
                className="flex items-center justify-center gap-1 px-4 py-3 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                예측 정확도
              </Link>
              <Link
                href="/compare"
                className="flex items-center justify-center gap-1 px-4 py-3 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                가격 비교
              </Link>
              <Link
                href="/analysis"
                className="flex items-center justify-center gap-1 px-4 py-3 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                시장 분석
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Link href="/news" className="text-xs text-primary-400 hover:underline">
                계란 뉴스
              </Link>
              <Link href="/guide" className="text-xs text-primary-400 hover:underline">
                지식백과
              </Link>
              <Link href="/data" className="text-xs text-primary-400 hover:underline">
                가격 데이터
              </Link>
              <Link href="/data-sources" className="text-xs text-primary-400 hover:underline">
                데이터 출처
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 면책 */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
          <p>데이터 출처: KAMIS(한국농수산식품유통공사), 매일 업데이트</p>
          <p>
            슬기알 AI 예측은 통계적 추정치이며, 실제 가격은 달라질 수 있습니다.
            예측 정보는 의사결정의 참고 자료로만 활용하시기 바랍니다.
          </p>
        </div>
      </div>
    </>
  );
}
