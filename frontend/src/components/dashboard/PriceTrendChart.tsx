"use client";

import { useState, useMemo, useEffect } from "react";
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
import { GRADES } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { usePriceHistory } from "@/lib/queries";

const GRADE_COLORS: Record<string, string> = {
  왕란: "#8b5cf6",
  특란: "#FF6B35",
  대란: "#FFC864",
  중란: "#4CAF50",
  소란: "#3b82f6",
};

const CHART_CACHE_KEY = "egg-chart-cache";

type ChartRow = Record<string, string | number>;

export default function PriceTrendChart() {
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["특란"]);

  // Load cached chart data after mount to avoid hydration mismatch
  const [cachedChartData, setCachedChartData] = useState<ChartRow[] | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHART_CACHE_KEY);
      if (stored) setCachedChartData(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const { data: historyWangran, isLoading: l1 } = usePriceHistory("왕란", 180);
  const { data: historyTeukran, isLoading: l2 } = usePriceHistory("특란", 180);
  const { data: historyDaeran, isLoading: l3 } = usePriceHistory("대란", 180);
  const { data: historyJungran, isLoading: l4 } = usePriceHistory("중란", 180);
  const { data: historySoran, isLoading: l5 } = usePriceHistory("소란", 180);

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const freshChartData = useMemo(() => {
    const allHistories: Record<string, typeof historyWangran> = {
      왕란: historyWangran,
      특란: historyTeukran,
      대란: historyDaeran,
      중란: historyJungran,
      소란: historySoran,
    };

    // Merge all grades into date-keyed records
    const dateMap = new Map<string, ChartRow>();

    for (const [grade, history] of Object.entries(allHistories)) {
      if (!history) continue;
      for (const row of history) {
        if (!dateMap.has(row.date)) {
          dateMap.set(row.date, { date: row.date });
        }
        const entry = dateMap.get(row.date)!;
        entry[grade] = row.retail_price ?? row.wholesale_price ?? 0;
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );
  }, [historyWangran, historyTeukran, historyDaeran, historyJungran, historySoran]);

  // Only switch to fresh data once ALL queries are done
  const isFreshReady = !isLoading && freshChartData.length > 0;

  // Persist fresh chart data to localStorage only when complete
  useEffect(() => {
    if (isFreshReady) {
      localStorage.setItem(CHART_CACHE_KEY, JSON.stringify(freshChartData));
    }
  }, [isFreshReady, freshChartData]);

  const displayData = isFreshReady ? freshChartData : (cachedChartData ?? []);
  const hasData = displayData.length > 0;

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade)
        ? prev.filter((g) => g !== grade)
        : [...prev, grade]
    );
  };

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

        {!hasData ? (
          <div className="flex items-center justify-center gap-2 h-[180px]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">불러오는 중...</span>
          </div>
        ) : (
          <div className="relative">
            {isLoading && !isFreshReady && cachedChartData && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/80 rounded px-2 py-1 z-10">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">최신 데이터 불러오는 중...</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={displayData}>
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
                  tickFormatter={(v: number) => `${v.toLocaleString()}원`}
                  width={62}
                  domain={[2500, "auto"]}
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
                <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
