"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PriceHistory, Prediction } from "@/types";

interface Props {
  history: PriceHistory[];
  predictions: Prediction[];
}

export default function PredictionChart({ history, predictions }: Props) {
  const histData = history.slice(-90).map((h) => ({
    date: h.date,
    actual: h.retail_price,
    predicted: null as number | null,
    ci_lower: null as number | null,
    ci_upper: null as number | null,
    ci_range: null as [number, number] | null,
  }));

  const predData = predictions.map((p) => ({
    date: p.target_date,
    actual: null as number | null,
    predicted: p.predicted_price,
    ci_lower: p.confidence_lower,
    ci_upper: p.confidence_upper,
    ci_range: [p.confidence_lower, p.confidence_upper] as [number, number],
  }));

  const lastHistorical = histData[histData.length - 1];
  if (lastHistorical && predData.length > 0) {
    const bridgePrice = lastHistorical.actual ?? 0;
    predData.unshift({
      date: lastHistorical.date,
      actual: null,
      predicted: bridgePrice,
      ci_lower: bridgePrice,
      ci_upper: bridgePrice,
      ci_range: [bridgePrice, bridgePrice] as [number, number],
    });
  }

  const chartData = [...histData, ...predData];
  const todayStr = lastHistorical?.date;

  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 예측 차트</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid hsl(214 32% 91%)",
                fontSize: "0.8rem",
              }}
              formatter={(value: number | [number, number], name: string) => {
                if (Array.isArray(value)) {
                  return [
                    `${value[0].toLocaleString()} ~ ${value[1].toLocaleString()}원`,
                    "90% 신뢰구간",
                  ];
                }
                return [`${value.toLocaleString()}원`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            {todayStr && (
              <ReferenceLine
                x={todayStr}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                label={{ value: "오늘", position: "top", fontSize: 11 }}
              />
            )}
            <Area
              type="monotone"
              dataKey="ci_range"
              name="90% 신뢰구간"
              fill="#FFF3C4"
              stroke="none"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="실제 가격"
              stroke="#FFC864"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="예측 가격"
              stroke="#FF6B35"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
