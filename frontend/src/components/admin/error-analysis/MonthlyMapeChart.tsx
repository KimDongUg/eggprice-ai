"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { MonthlyAnalysisItem } from "@/types/admin";

export default function MonthlyMapeChart({ data }: { data: MonthlyAnalysisItem[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">월별 MAPE 추이</h3>
          <p className="text-sm text-muted-foreground py-8 text-center">데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">월별 MAPE 추이 (%)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number, _name: string, props: { payload?: MonthlyAnalysisItem }) => [
                `${v.toFixed(2)}%${props.payload ? ` (n=${props.payload.sample_count})` : ""}`,
                "MAPE",
              ]}
            />
            <Bar dataKey="mape" name="MAPE" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
