"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Database } from "lucide-react";
import { useCurrentPrices, usePriceHistory } from "@/lib/queries";
import { GRADES } from "@/types";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PERIODS = [
  { label: "30일", days: 30 },
  { label: "90일", days: 90 },
  { label: "180일", days: 180 },
];

export default function PricePage() {
  const [selectedGrade, setSelectedGrade] = useState("특란");
  const [periodDays, setPeriodDays] = useState(30);
  const { data: prices, isLoading: pricesLoading } = useCurrentPrices();
  const { data: history, isLoading: historyLoading } = usePriceHistory(selectedGrade, periodDays);

  const selectedPrice = prices?.find((p) => p.grade === selectedGrade);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">오늘 계란 가격</h1>
        <p className="text-muted-foreground text-sm">
          KAMIS (한국농수산식품유통공사) 데이터 기반 실시간 계란 가격 정보
        </p>
      </div>

      {/* 등급별 가격 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {pricesLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : prices?.map((p) => (
              <Card
                key={p.grade}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedGrade === p.grade && "ring-2 ring-primary-400 shadow-md"
                )}
                onClick={() => setSelectedGrade(p.grade)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.grade}</span>
                    <span className="text-xs text-muted-foreground">30개</span>
                  </div>
                  <div className="text-xl font-bold font-mono-num">
                    {p.wholesale_price?.toLocaleString() ?? "-"}
                    <span className="text-sm font-normal text-muted-foreground">원</span>
                  </div>
                  {p.daily_change !== null && p.daily_change !== undefined && (
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-medium mt-1",
                      p.daily_change > 0 ? "text-danger-500" : p.daily_change < 0 ? "text-success-500" : "text-muted-foreground"
                    )}>
                      {p.daily_change > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : p.daily_change < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {p.daily_change > 0 ? "+" : ""}{p.daily_change?.toLocaleString()}원
                      {p.daily_change_pct !== null && (
                        <span className="text-xs">({p.daily_change_pct > 0 ? "+" : ""}{p.daily_change_pct?.toFixed(1)}%)</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>

      {/* 상세 가격 정보 */}
      {selectedPrice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedGrade} 상세 가격</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <span className="text-sm text-muted-foreground">도매가</span>
                <p className="text-2xl font-bold font-mono-num">
                  {selectedPrice.wholesale_price?.toLocaleString() ?? "-"}
                  <span className="text-sm font-normal">원</span>
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <span className="text-sm text-muted-foreground">소비자가</span>
                <p className="text-2xl font-bold font-mono-num">
                  {selectedPrice.retail_price?.toLocaleString() ?? "-"}
                  <span className="text-sm font-normal">원</span>
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <span className="text-sm text-muted-foreground">전일 대비</span>
                <p className={cn(
                  "text-2xl font-bold font-mono-num",
                  (selectedPrice.daily_change ?? 0) > 0 ? "text-danger-500" : (selectedPrice.daily_change ?? 0) < 0 ? "text-success-500" : ""
                )}>
                  {(selectedPrice.daily_change ?? 0) > 0 ? "+" : ""}{selectedPrice.daily_change?.toLocaleString() ?? "0"}
                  <span className="text-sm font-normal">원</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기간별 가격 추이 차트 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">{selectedGrade} 가격 추이</CardTitle>
            <div className="flex gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => setPeriodDays(p.days)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
                    periodDays === p.days
                      ? "bg-primary-400 text-white"
                      : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-[300px]" />
          ) : history && history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value?.toLocaleString()}원`]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="wholesale_price"
                  name="도매가"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="retail_price"
                  name="소비자가"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 데이터 출처 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        데이터 출처: KAMIS (한국농수산식품유통공사) | 매일 업데이트
      </div>
    </div>
  );
}
