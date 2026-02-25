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
import type { CorrelationItem } from "@/types/admin";

export default function CorrelationChart({ correlations }: { correlations: CorrelationItem[] }) {
  const chartData = correlations
    .filter((c) => c.correlation_with_price != null)
    .map((c) => ({
      factor: c.factor,
      correlation: c.correlation_with_price!,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">요인별 상관계수</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">상관계수 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">요인별 상관계수 (가격)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="factor" width={100} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toFixed(4)} />
            <Bar dataKey="correlation" name="상관계수">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.correlation >= 0 ? "#2563eb" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
