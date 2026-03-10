"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPrices } from "@/lib/queries";

export default function WholesaleRetailChart() {
  const { data: prices, isLoading } = useCurrentPrices();

  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  const chartData = (prices || []).map((p) => ({
    grade: p.grade,
    도매가: p.wholesale_price ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>등급별 도매가</CardTitle>
        <CardDescription>
          등급별 도매 유통가격을 비교합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
            <XAxis
              dataKey="grade"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={["dataMin - 200", "dataMax + 200"]}
              tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
              tickFormatter={(v) => `${v.toLocaleString()}원`}
              width={45}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.5rem",
                border: "1px solid hsl(214 32% 91%)",
                fontSize: "0.8rem",
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()}원`,
                name,
              ]}
            />
            <Bar
              dataKey="도매가"
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
