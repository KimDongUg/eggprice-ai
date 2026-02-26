"use client";

import { useState } from "react";
import { usePredVsActual, useMonthlyComparison } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GRADES } from "@/types";
import PredVsActualChart from "@/components/admin/analysis/PredVsActualChart";
import ErrorTable from "@/components/admin/analysis/ErrorTable";
import MonthlyComparisonChart from "@/components/admin/analysis/MonthlyComparisonChart";

const HORIZONS = [
  { value: 7, label: "7일" },
  { value: 14, label: "14일" },
  { value: 30, label: "30일" },
  { value: 60, label: "익월" },
];

export default function AnalysisPage() {
  const [grade, setGrade] = useState("특란");
  const [horizon, setHorizon] = useState(7);
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const { data, isLoading } = usePredVsActual(grade, horizon);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyComparison(grade, horizon);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">예측 vs 실제 분석</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
            <button
              onClick={() => setView("daily")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "daily" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              일별
            </button>
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "monthly" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              월별
            </button>
          </div>
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
      </div>

      <Tabs value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
        <TabsList>
          {HORIZONS.map((h) => (
            <TabsTrigger key={h.value} value={String(h.value)}>{h.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {view === "daily" ? (
        isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : data ? (
          <>
            <PredVsActualChart items={data.items} />
            <ErrorTable items={data.items} />
          </>
        ) : (
          <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
        )
      ) : monthlyLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : monthlyData ? (
        <MonthlyComparisonChart items={monthlyData.items} />
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
