"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceHistory } from "@/lib/queries";
import { cn } from "@/lib/utils";

const COMPARE_GRADES = [
  { grade: "왕란", color: "#8b5cf6" },
  { grade: "특란", color: "#FF6B35" },
  { grade: "대란", color: "#FFC864" },
  { grade: "중란", color: "#4CAF50" },
  { grade: "소란", color: "#3b82f6" },
];

export default function PriceHistoryComparison() {
  const [days, setDays] = useState(90);

  const queries = COMPARE_GRADES.map((g) => ({
    ...g,
    ...usePriceHistory(g.grade, days),
  }));

  const isLoading = queries.some((q) => q.isLoading);

  // Merge all grades by date
  const dateMap = new Map<string, Record<string, number | string>>();
  for (const q of queries) {
    for (const item of q.data || []) {
      const existing = dateMap.get(item.date) || { date: item.date };
      if (item.retail_price !== null) {
        existing[q.grade] = item.retail_price;
      }
      dateMap.set(item.date, existing);
    }
  }
  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>등급별 가격 추이 비교</CardTitle>
            <CardDescription>
              모든 등급의 소비자가격 변화를 한눈에 비교합니다.
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {[30, 90, 180].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  days === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
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
                domain={[2000, 'auto']}
                ticks={(() => {
                  const allPrices = chartData.flatMap((d) =>
                    COMPARE_GRADES.map((g) => d[g.grade]).filter((v): v is number => typeof v === 'number')
                  );
                  const max = Math.max(...allPrices, 2000);
                  const result: number[] = [];
                  for (let t = 2000; t <= max + 2000; t += 2000) result.push(t);
                  return result;
                })()}
                tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }}
                tickFormatter={(v: number) => v.toLocaleString()}
                width={55}
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
              {COMPARE_GRADES.map((g) => (
                <Line
                  key={g.grade}
                  type="monotone"
                  dataKey={g.grade}
                  name={g.grade}
                  stroke={g.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
