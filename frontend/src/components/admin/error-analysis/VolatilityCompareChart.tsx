"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { VolatilityAnalysis } from "@/types/admin";

export default function VolatilityCompareChart({ data }: { data: VolatilityAnalysis | null }) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">급등락 vs 일반 구간 오차 비교</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 부족합니다</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      label: `급등락 (≥${data.threshold_pct}%)`,
      평균오차율: data.volatile_avg_error_pct,
      샘플수: data.volatile_sample_count,
    },
    {
      label: "일반 구간",
      평균오차율: data.normal_avg_error_pct,
      샘플수: data.normal_sample_count,
    },
  ];

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-1">급등락 vs 일반 구간 오차 비교</h3>
        <p className="text-xs text-muted-foreground mb-4">
          일간 변동률 상위 10% (≥{data.threshold_pct}%) 구간과 나머지 비교
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, _name: string, props: { payload?: typeof chartData[0] }) => [
                `${v.toFixed(2)}%${props.payload ? ` (n=${props.payload.샘플수})` : ""}`,
                "평균 오차율",
              ]}
            />
            <Legend />
            <Bar dataKey="평균오차율" name="평균 오차율 (%)" fill="#f97316" barSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
