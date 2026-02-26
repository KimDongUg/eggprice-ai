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
import type { ModelVersionItem } from "@/types/admin";

export default function ModelComparisonChart({ models }: { models: ModelVersionItem[] }) {
  const chartData = models
    .filter((m) => m.avg_mape != null)
    .map((m) => ({
      version: m.model_version,
      mape: m.avg_mape!,
      is_production: m.is_production,
      eval_count: m.eval_count,
    }))
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">모델 버전별 MAPE 비교</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">비교 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">모델 버전별 MAPE 비교</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="version" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: "MAPE (%)", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
            <Tooltip
              formatter={(v: number, _name: string, props: { payload?: typeof chartData[0] }) => [
                `${v.toFixed(2)}%${props.payload ? ` (평가 ${props.payload.eval_count}건)` : ""}`,
                "MAPE",
              ]}
            />
            <Bar dataKey="mape" name="MAPE">
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.is_production ? "#10b981" : "#94a3b8"}
                  stroke={entry.is_production ? "#059669" : "none"}
                  strokeWidth={entry.is_production ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> 운영 중
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" /> 비활성
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
