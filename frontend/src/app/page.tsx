"use client";

import { useState, useEffect } from "react";
import PriceSummaryCard from "@/components/dashboard/PriceSummaryCard";
import PriceTrendChart from "@/components/dashboard/PriceTrendChart";
import AIPredictionSummary from "@/components/dashboard/AIPredictionSummary";
import MarketFactorsCard from "@/components/dashboard/MarketFactorsCard";
import QuickAlertSetup from "@/components/dashboard/QuickAlertSetup";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCurrentPrices, useForecast, useMarketSnapshot } from "@/lib/queries";
import type { PriceWithChange } from "@/types";

const PRICES_CACHE_KEY = "egg-prices-cache";

function PriceSkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16 mt-1" />
      </CardContent>
    </Card>
  );
}

function SectionSpinner({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-2 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{text}</span>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  // Read cached prices from localStorage on mount (synchronous, before first paint)
  const [cachedPrices] = useState<PriceWithChange[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(PRICES_CACHE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const { data: prices } = useCurrentPrices();
  const { data: forecast, isLoading: forecastLoading } = useForecast("특란");
  const { data: market, isLoading: marketLoading } = useMarketSnapshot();

  // Persist fresh prices to localStorage for next visit
  useEffect(() => {
    if (prices) {
      localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify(prices));
    }
  }, [prices]);

  const displayPrices = prices ?? cachedPrices;
  const isFresh = !!prices;

  return (
    <div className="space-y-6">
      {/* Section: 오늘의/이전 계란 가격 */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          {isFresh ? "오늘의 계란 가격" : displayPrices ? "이전 계란 가격" : "오늘의 계란 가격"}
          {!isFresh && displayPrices && (
            <span className="text-xs font-normal text-muted-foreground">
              (최신 데이터 불러오는 중...)
            </span>
          )}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {displayPrices
            ? displayPrices.map((p) => (
                <PriceSummaryCard key={p.grade} data={p} />
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <PriceSkeletonCard key={i} />
              ))}
        </div>
      </section>

      {/* Section: AI 예측 + 시장 요인 (2컬럼) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            AI 가격 예측
          </h2>
          {forecastLoading || !forecast ? (
            <SectionSpinner text="AI 예측 중..." />
          ) : (
            <AIPredictionSummary data={forecast} />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            시장 요인
          </h2>
          {marketLoading || !market ? (
            <SectionSpinner text="불러오는 중..." />
          ) : (
            <MarketFactorsCard data={market} />
          )}
        </div>
      </section>

      {/* Section: 가격 추이 차트 */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          가격 추이 (최근 6개월)
        </h2>
        <PriceTrendChart />
      </section>

      {/* Section: 빠른 알림 설정 */}
      <section>
        <QuickAlertSetup />
      </section>
    </div>
  );
}
