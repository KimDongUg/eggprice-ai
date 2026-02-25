"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { AccuracyTrendItem } from "@/types/admin";

export default function AccuracyTrendChart({ data }: { data: AccuracyTrendItem[] }) {
  const formatted = data.map((d) => ({
    ...d,
    week: d.week.slice(0, 10),
  }));

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">정확도 추이 (주간 MAPE)</h3>
        {formatted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
              <Line
                type="monotone"
                dataKey="mape"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="MAPE"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
