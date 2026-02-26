"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ScatterDataItem } from "@/types/admin";

const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function FactorScatterPlot({ scatterData }: { scatterData: ScatterDataItem[] }) {
  const factors = Array.from(new Set(scatterData.map((d) => d.factor)));

  if (factors.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">요인 vs 가격 산점도</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">요인 값 vs 가격 산점도</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="factor_value" name="요인 값" tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="price" name="가격" tick={{ fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            {factors.map((factor, i) => (
              <Scatter
                key={factor}
                name={factor}
                data={scatterData.filter((d) => d.factor === factor)}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
