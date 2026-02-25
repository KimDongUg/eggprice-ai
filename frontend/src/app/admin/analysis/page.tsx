"use client";

import { useState } from "react";
import { usePredVsActual } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GRADES } from "@/types";
import PredVsActualChart from "@/components/admin/analysis/PredVsActualChart";
import ErrorTable from "@/components/admin/analysis/ErrorTable";

const HORIZONS = [
  { value: 7, label: "7일" },
  { value: 14, label: "14일" },
  { value: 30, label: "30일" },
  { value: 60, label: "익월" },
];

export default function AnalysisPage() {
  const [grade, setGrade] = useState("대란");
  const [horizon, setHorizon] = useState(7);
  const { data, isLoading } = usePredVsActual(grade, horizon);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">예측 vs 실제 분석</h1>
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

      <Tabs value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
        <TabsList>
          {HORIZONS.map((h) => (
            <TabsTrigger key={h.value} value={String(h.value)}>{h.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
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
      )}
    </div>
  );
}
