"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { PredVsActualItem } from "@/types/admin";

export default function PredVsActualChart({ items }: { items: PredVsActualItem[] }) {
  const chartData = items
    .filter((d) => d.actual_price != null)
    .map((d) => ({
      date: d.target_date.slice(5),
      actual: d.actual_price,
      predicted: d.predicted_price,
      error: d.error,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground py-8 text-center">비교 가능한 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">예측 vs 실제 가격</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="price" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="error" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="price" type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} name="실제" dot={false} />
            <Line yAxisId="price" type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="예측" dot={false} />
            <Bar yAxisId="error" dataKey="error" fill="#ef444460" name="오차" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
