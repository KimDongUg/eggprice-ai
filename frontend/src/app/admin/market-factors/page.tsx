"use client";

import { useState } from "react";
import { useMarketFactorAnalysis } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/types";
import CorrelationChart from "@/components/admin/market/CorrelationChart";
import VolatilityChart from "@/components/admin/market/VolatilityChart";
import FactorScatterPlot from "@/components/admin/market/FactorScatterPlot";
import FactorErrorScatter from "@/components/admin/market/FactorErrorScatter";

export default function MarketFactorsPage() {
  const [grade, setGrade] = useState("대란");
  const { data, isLoading } = useMarketFactorAnalysis(grade);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">외부시장요인 영향 분석</h1>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <CorrelationChart correlations={data.correlations} />
          <FactorErrorScatter data={data.factor_error_scatter} />
          <VolatilityChart scatterData={data.scatter_data} />
          <FactorScatterPlot scatterData={data.scatter_data} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
