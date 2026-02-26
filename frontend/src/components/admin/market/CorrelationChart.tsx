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
import type { CorrelationItem } from "@/types/admin";

export default function CorrelationChart({ correlations }: { correlations: CorrelationItem[] }) {
  const chartData = correlations
    .filter((c) => c.correlation_with_price != null)
    .map((c) => ({
      factor: c.factor,
      가격_상관계수: c.correlation_with_price!,
      오차_상관계수: c.correlation_with_error ?? 0,
    }));

  const hasErrorCorr = correlations.some((c) => c.correlation_with_error != null);

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
        <h3 className="text-sm font-semibold mb-4">
          요인별 상관계수 {hasErrorCorr ? "(가격 + 예측오차)" : "(가격)"}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="factor" width={110} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toFixed(4)} />
            {hasErrorCorr && <Legend />}
            <Bar dataKey="가격_상관계수" name="가격 상관계수" fill="#2563eb" barSize={hasErrorCorr ? 12 : 20} />
            {hasErrorCorr && (
              <Bar dataKey="오차_상관계수" name="오차 상관계수" fill="#f97316" barSize={12} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
