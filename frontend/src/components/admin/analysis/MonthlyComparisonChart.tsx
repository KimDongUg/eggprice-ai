"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthlyComparisonItem } from "@/types/admin";

export default function MonthlyComparisonChart({ items }: { items: MonthlyComparisonItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">월간 예측 비교</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">월간 예측 vs 실제 비교</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={items}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="price" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="mape" orientation="right" tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              formatter={(v: number, name: string) => {
                if (name === "MAPE") return [`${v.toFixed(2)}%`, name];
                return [v.toLocaleString(), name];
              }}
            />
            <Legend />
            <Bar yAxisId="price" dataKey="avg_predicted" name="평균 예측가" fill="#93c5fd" barSize={20} />
            <Bar yAxisId="price" dataKey="avg_actual" name="평균 실제가" fill="#3b82f6" barSize={20} />
            <Line yAxisId="mape" type="monotone" dataKey="mape" name="MAPE" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
