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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceHistory } from "@/lib/queries";
import { GRADES } from "@/types";
import type { PriceHistory } from "@/types";
import { cn } from "@/lib/utils";

const GRADE_COLORS: Record<string, string> = {
  왕란: "#8b5cf6",
  특란: "#FF6B35",
  대란: "#FFC864",
  중란: "#4CAF50",
  소란: "#3b82f6",
};

export default function PriceTrendChart() {
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["대란"]);

  const queries = GRADES.map((g) => ({
    grade: g,
    ...usePriceHistory(g, 180),
  }));

  const isLoading = queries.some(
    (q) => selectedGrades.includes(q.grade) && q.isLoading
  );

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

  const dateMap = new Map<string, Record<string, number | string>>();
  for (const grade of selectedGrades) {
    const q = queries.find((q) => q.grade === grade);
    const history: PriceHistory[] = q?.data || [];
    for (const item of history) {
      const existing = dateMap.get(item.date) || { date: item.date };
      if (item.retail_price !== null) {
        existing[grade] = item.retail_price;
      }
      dateMap.set(item.date, existing);
    }
  }
  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => toggleGrade(grade)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                selectedGrades.includes(grade)
                  ? "text-white border-transparent shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary-400/50"
              )}
              style={
                selectedGrades.includes(grade)
                  ? { backgroundColor: GRADE_COLORS[grade] }
                  : undefined
              }
            >
              {grade}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-[360px] w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={360}>
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
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: "0.75rem" }}
              />
              {selectedGrades.map((grade) => (
                <Line
                  key={grade}
                  type="monotone"
                  dataKey={grade}
                  name={grade}
                  stroke={GRADE_COLORS[grade]}
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
