"use client";

import WholesaleRetailChart from "@/components/compare/WholesaleRetailChart";
import GradeComparisonTable from "@/components/compare/GradeComparisonTable";
import PriceHistoryComparison from "@/components/compare/PriceHistoryComparison";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 비교</h1>
        <p className="text-muted-foreground text-sm">
          소비자가 vs 산지가, 등급 간 가격 차이를 비교 분석합니다.
        </p>
      </div>

      <GradeComparisonTable />
      <WholesaleRetailChart />
      <PriceHistoryComparison />
    </div>
  );
}
