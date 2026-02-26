"use client";

import { useState } from "react";
import { useErrorAnalysis } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/types";
import TopErrorsTable from "@/components/admin/error-analysis/TopErrorsTable";
import WeekdayChart from "@/components/admin/error-analysis/WeekdayChart";
import MonthlyMapeChart from "@/components/admin/error-analysis/MonthlyMapeChart";
import VolatilityCompareChart from "@/components/admin/error-analysis/VolatilityCompareChart";

const HORIZONS = [
  { value: 7, label: "7일" },
  { value: 14, label: "14일" },
  { value: 30, label: "30일" },
  { value: 60, label: "익월" },
];

export default function ErrorAnalysisPage() {
  const [grade, setGrade] = useState("대란");
  const [horizon, setHorizon] = useState(7);
  const { data, isLoading } = useErrorAnalysis(grade, horizon);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">오차 분석</h1>
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

      {/* Horizon tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {HORIZONS.map((h) => (
          <button
            key={h.value}
            onClick={() => setHorizon(h.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              horizon === h.value
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-96 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <TopErrorsTable items={data.top_errors} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WeekdayChart data={data.weekday_analysis} />
            <MonthlyMapeChart data={data.monthly_analysis} />
          </div>
          <VolatilityCompareChart data={data.volatility} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
