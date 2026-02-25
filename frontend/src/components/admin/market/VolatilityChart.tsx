"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ScatterDataItem } from "@/types/admin";

export default function VolatilityChart({ scatterData }: { scatterData: ScatterDataItem[] }) {
  // Group scatter data by factor and compute moving stats
  const factors = Array.from(new Set(scatterData.map((d) => d.factor)));

  if (factors.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">변동성 구간 분석</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  // Use first factor for volatility visualization
  const firstFactor = factors[0];
  const factorPoints = scatterData
    .filter((d) => d.factor === firstFactor)
    .map((d, i) => ({
      idx: i,
      price: d.price,
      factor_value: d.factor_value,
    }));

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">{firstFactor} vs 가격 추이</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={factorPoints}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="idx" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="price" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="factor" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area yAxisId="price" type="monotone" dataKey="price" fill="#2563eb20" stroke="#2563eb" name="가격" />
            <Line yAxisId="factor" type="monotone" dataKey="factor_value" stroke="#f59e0b" strokeWidth={2} dot={false} name={firstFactor} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
