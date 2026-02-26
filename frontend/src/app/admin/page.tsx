"use client";

import { useState } from "react";
import { useAdminDashboard, useModelVersionsList } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/types";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import AccuracyTrendChart from "@/components/admin/dashboard/AccuracyTrendChart";
import ErrorAlertTable from "@/components/admin/dashboard/ErrorAlertTable";
import SurgeAlertPanel from "@/components/admin/dashboard/SurgeAlertPanel";
import DataQualityBanner from "@/components/admin/dashboard/DataQualityBanner";

const PERIOD_OPTIONS = [
  { value: 7, label: "7일" },
  { value: 30, label: "30일" },
  { value: 90, label: "90일" },
];

export default function AdminDashboardPage() {
  const [grade, setGrade] = useState("대란");
  const [periodDays, setPeriodDays] = useState(90);
  const [modelVersion, setModelVersion] = useState<string>("");
  const { data: versions } = useModelVersionsList(grade);
  const { data, isLoading } = useAdminDashboard(grade, periodDays, modelVersion || undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">예측 성능 대시보드</h1>
        <div className="flex items-center gap-3">
          <select
            value={modelVersion}
            onChange={(e) => setModelVersion(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">전체 모델</option>
            {versions?.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodDays(p.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  periodDays === p.value
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <DataQualityBanner data={data.data_quality} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.horizon_days} data={kpi} />
            ))}
          </div>
          {data.surge_alerts.length > 0 && (
            <SurgeAlertPanel alerts={data.surge_alerts} />
          )}
          <AccuracyTrendChart data={data.accuracy_trend} />
          <ErrorAlertTable data={data.error_alerts} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
