"use client";

import { useState } from "react";
import { useAdminDashboard } from "@/lib/admin-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { GRADES } from "@/types";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import AccuracyTrendChart from "@/components/admin/dashboard/AccuracyTrendChart";
import ErrorAlertTable from "@/components/admin/dashboard/ErrorAlertTable";

export default function AdminDashboardPage() {
  const [grade, setGrade] = useState("대란");
  const { data, isLoading } = useAdminDashboard(grade);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">예측 성능 대시보드</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.horizon_days} data={kpi} />
            ))}
          </div>
          <AccuracyTrendChart data={data.accuracy_trend} />
          <ErrorAlertTable data={data.error_alerts} />
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
