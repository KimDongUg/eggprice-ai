"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiCard as KpiCardType } from "@/types/admin";

export default function KpiCard({ data }: { data: KpiCardType }) {
  const trendIcon =
    data.trend === "down" ? <ArrowDown className="h-4 w-4" /> :
    data.trend === "up" ? <ArrowUp className="h-4 w-4" /> :
    <Minus className="h-4 w-4" />;

  const trendColor =
    data.trend === "down" ? "text-green-600" :
    data.trend === "up" ? "text-red-600" :
    "text-gray-500";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-1">{data.label} MAPE</p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">
            {data.mape != null ? `${data.mape}%` : "N/A"}
          </span>
          {data.trend && data.prev_mape != null && (
            <span className={cn("flex items-center text-sm font-medium", trendColor)}>
              {trendIcon}
              {Math.abs((data.mape ?? 0) - data.prev_mape).toFixed(1)}%p
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {data.mae != null && (
            <span>MAE {data.mae.toLocaleString()}원</span>
          )}
          <span>샘플 {data.sample_count}건</span>
          <span>이전 {data.prev_mape != null ? `${data.prev_mape}%` : "N/A"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
