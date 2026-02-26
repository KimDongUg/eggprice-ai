"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SurgeAlert } from "@/types/admin";

export default function SurgeAlertPanel({ alerts }: { alerts: SurgeAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="text-sm font-semibold text-orange-800">급등락 구간 오차 확대 경고</h3>
        </div>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 text-sm border border-orange-100"
            >
              <div>
                <span className="font-medium text-gray-900">
                  {a.period_start === a.period_end
                    ? a.period_start
                    : `${a.period_start} ~ ${a.period_end}`}
                </span>
                <span className="text-gray-500 ml-2">
                  가격 변동 {a.price_change_pct > 0 ? "+" : ""}{a.price_change_pct}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-xs text-gray-500">평균 오차</span>
                  <span className="ml-1 font-medium text-red-600">{a.avg_error_pct}%</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">일반 대비</span>
                  <span className="ml-1 font-bold text-orange-700">{a.amplification_ratio}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
