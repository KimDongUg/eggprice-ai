"use client";

import PriceSummaryCard from "@/components/dashboard/PriceSummaryCard";
import PriceTrendChart from "@/components/dashboard/PriceTrendChart";
import MarketFactorsCard from "@/components/dashboard/MarketFactorsCard";
import ModelPerformanceCard from "@/components/dashboard/ModelPerformanceCard";
import AIPredictionSummary from "@/components/dashboard/AIPredictionSummary";
import QuickAlertSetup from "@/components/dashboard/QuickAlertSetup";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCurrentPrices,
  useMarketSnapshot,
  useCurrentModel,
  useForecast,
} from "@/lib/queries";

export default function DashboardPage() {
  const {
    data: prices,
    isLoading: pricesLoading,
    error: pricesError,
  } = useCurrentPrices();
  const { data: marketData } = useMarketSnapshot();
  const { data: modelPerf } = useCurrentModel("대란");
  const { data: forecast } = useForecast("대란");

  if (pricesError) {
    return (
      <div className="bg-danger-50 border border-danger-500/20 rounded-lg p-4 text-danger-700">
        {pricesError instanceof Error
          ? pricesError.message
          : "데이터를 불러올 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section: 오늘의 계란 가격 */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          📊 오늘의 계란 가격
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pricesLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            : prices?.map((p) => (
                <PriceSummaryCard key={p.grade} data={p} />
              ))}
        </div>
      </section>

      {/* Section: AI 예측 */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          🤖 AI 예측
        </h2>
        {forecast ? (
          <AIPredictionSummary data={forecast} />
        ) : (
          <Skeleton className="h-56 rounded-xl" />
        )}
      </section>

      {/* Section: 가격 추이 */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          📈 가격 추이 (최근 6개월)
        </h2>
        <PriceTrendChart />
      </section>

      {/* Section: 빠른 알림 설정 */}
      <section>
        <QuickAlertSetup />
      </section>

      {/* Section: 외부 시장 요인 */}
      <MarketFactorsCard data={marketData ?? null} />

      {/* Section: 모델 성능 */}
      <ModelPerformanceCard data={modelPerf ?? null} />
    </div>
  );
}
