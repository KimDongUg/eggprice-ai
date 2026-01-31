"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
    소비자가: p.retail_price ?? 0,
    산지가: p.wholesale_price ?? 0,
    유통마진:
      p.retail_price && p.wholesale_price
        ? p.retail_price - p.wholesale_price
        : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>소비자가 vs 산지가</CardTitle>
        <CardDescription>
          등급별 소비자가격과 산지가격의 차이를 비교합니다.
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
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()}원`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            <Bar
              dataKey="소비자가"
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="산지가"
              fill="#FFC864"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Margin table */}
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            유통 마진
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {chartData.map((d) => (
              <div key={d.grade} className="text-center">
                <p className="text-xs text-muted-foreground">{d.grade}</p>
                <p className="font-mono-num text-sm font-bold text-primary-400">
                  {d.유통마진.toLocaleString()}원
                </p>
                {d.소비자가 > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    ({((d.유통마진 / d.소비자가) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
