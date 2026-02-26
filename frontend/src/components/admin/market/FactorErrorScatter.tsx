"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { FactorErrorScatterItem } from "@/types/admin";

const COLORS: Record<string, string> = {
  "사료가격": "#2563eb",
  "환율(USD/KRW)": "#f59e0b",
  "평균기온": "#10b981",
  "거래량": "#ef4444",
  "조류독감": "#8b5cf6",
};

function linearRegression(data: { x: number; y: number }[]) {
  if (data.length < 2) return null;
  const n = data.length;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function FactorErrorScatter({ data }: { data: FactorErrorScatterItem[] }) {
  const factors = Array.from(new Set(data.map((d) => d.factor)));
  const [selectedFactor, setSelectedFactor] = useState(factors[0] || "");

  if (data.length === 0 || factors.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">요인 변화율 vs 예측 오차</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const filtered = data.filter((d) => d.factor === selectedFactor);
  const reg = linearRegression(
    filtered.map((d) => ({ x: d.factor_change_pct, y: d.error_pct }))
  );

  const xValues = filtered.map((d) => d.factor_change_pct);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);

  // Compute two points for the regression line
  const regPoints = reg
    ? [
        { factor_change_pct: xMin, error_pct: reg.slope * xMin + reg.intercept },
        { factor_change_pct: xMax, error_pct: reg.slope * xMax + reg.intercept },
      ]
    : [];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">요인 변화율 vs 예측 오차</h3>
          <select
            value={selectedFactor}
            onChange={(e) => setSelectedFactor(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm"
          >
            {factors.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="factor_change_pct"
              name="변화율"
              unit="%"
              tick={{ fontSize: 11 }}
              label={{ value: `${selectedFactor} 변화율 (%)`, position: "insideBottom", offset: -5, style: { fontSize: 11 } }}
            />
            <YAxis
              type="number"
              dataKey="error_pct"
              name="오차율"
              unit="%"
              tick={{ fontSize: 11 }}
              label={{ value: "예측 오차율 (%)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
            />
            <Tooltip
              formatter={(v: number, name: string) => [
                `${v.toFixed(2)}%`,
                name === "변화율" ? `${selectedFactor} 변화율` : "예측 오차율",
              ]}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Scatter
              name={selectedFactor}
              data={filtered}
              fill={COLORS[selectedFactor] || "#6366f1"}
              opacity={0.6}
            />
            {regPoints.length === 2 && (
              <Scatter
                name="회귀선"
                data={regPoints}
                fill="none"
                line={{ stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5 5" }}
                legendType="line"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        {reg && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            회귀식: 오차 = {reg.slope.toFixed(3)} x 변화율 + {reg.intercept.toFixed(2)}
            {reg.slope > 0 ? " (양의 상관)" : reg.slope < 0 ? " (음의 상관)" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
