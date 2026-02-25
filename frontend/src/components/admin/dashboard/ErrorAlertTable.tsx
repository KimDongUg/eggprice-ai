"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ErrorAlertItem } from "@/types/admin";

function severityBadge(pct: number) {
  if (pct > 15) return <Badge variant="destructive">심각</Badge>;
  if (pct > 10) return <Badge className="bg-orange-500 text-white">경고</Badge>;
  return <Badge variant="secondary">주의</Badge>;
}

export default function ErrorAlertTable({ data }: { data: ErrorAlertItem[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">오차 경고 (최근 30일, MAPE &gt; 5%)</h3>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">경고 항목이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">날짜</th>
                  <th className="pb-2 pr-4">예측</th>
                  <th className="pb-2 pr-4">실제</th>
                  <th className="pb-2 pr-4">오차율</th>
                  <th className="pb-2 pr-4">구간</th>
                  <th className="pb-2">심각도</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.target_date}</td>
                    <td className="py-2 pr-4">{row.predicted.toLocaleString()}원</td>
                    <td className="py-2 pr-4">{row.actual.toLocaleString()}원</td>
                    <td className="py-2 pr-4 font-medium">{row.error_pct}%</td>
                    <td className="py-2 pr-4">{row.horizon_days}일</td>
                    <td className="py-2">{severityBadge(row.error_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
