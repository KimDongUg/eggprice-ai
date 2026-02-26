"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { WeekdayAnalysisItem } from "@/types/admin";

export default function WeekdayChart({ data }: { data: WeekdayAnalysisItem[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">요일별 평균 오차율</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.avg_error_pct));

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">요일별 평균 오차율 (%)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekday_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, _name: string, props: { payload?: WeekdayAnalysisItem }) => [
                `${v.toFixed(2)}%${props.payload ? ` (n=${props.payload.sample_count})` : ""}`,
                "평균 오차율",
              ]}
            />
            <Bar dataKey="avg_error_pct" name="평균 오차율">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avg_error_pct >= maxVal * 0.9 ? "#ef4444" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
