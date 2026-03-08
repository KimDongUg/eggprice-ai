"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Lock, ArrowRight } from "lucide-react";
import { useForecast } from "@/lib/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart,
} from "recharts";

const GRADE_OPTIONS = ["특란", "대란", "중란", "소란"];

export default function PredictionPage() {
  const [selectedGrade, setSelectedGrade] = useState("특란");
  const { data: forecast, isLoading } = useForecast(selectedGrade);

  const predictions7d = forecast?.predictions?.slice(0, 7) ?? [];
  const predictions30d = forecast?.predictions?.slice(0, 30) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI 가격 예측</h1>
        <p className="text-muted-foreground text-sm">
          머신러닝 기반 계란 가격 단기·중기 예측 정보
        </p>
      </div>

      {/* Grade tabs */}
      <Tabs value={selectedGrade} onValueChange={setSelectedGrade}>
        <TabsList>
          {GRADE_OPTIONS.map((g) => (
            <TabsTrigger key={g} value={g}>{g}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      ) : forecast ? (
        <>
          {/* Trend summary */}
          <Card className="bg-gradient-to-r from-card to-accent/20">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">추세:</span>
                  <Badge className={cn(
                    "gap-1",
                    forecast.trend === "상승" ? "bg-danger-50 text-danger-500" :
                    forecast.trend === "하락" ? "bg-success-50 text-success-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {forecast.trend === "상승" && <TrendingUp className="h-3 w-3" />}
                    {forecast.trend === "하락" && <TrendingDown className="h-3 w-3" />}
                    {forecast.trend === "보합" && <Minus className="h-3 w-3" />}
                    {forecast.trend}
                  </Badge>
                </div>
                {forecast.current_price && (
                  <div>
                    <span className="text-xs text-muted-foreground">현재가</span>
                    <p className="font-mono-num font-bold">{forecast.current_price.toLocaleString()}원</p>
                  </div>
                )}
                {predictions7d.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">7일 후</span>
                    <p className="font-mono-num font-bold">
                      {predictions7d[predictions7d.length - 1].price.toLocaleString()}원
                      <span className={cn(
                        "text-xs ml-1",
                        predictions7d[predictions7d.length - 1].change_percent > 0 ? "text-danger-500" :
                        predictions7d[predictions7d.length - 1].change_percent < 0 ? "text-success-500" :
                        "text-muted-foreground"
                      )}>
                        {predictions7d[predictions7d.length - 1].change_percent > 0 ? "+" : ""}
                        {predictions7d[predictions7d.length - 1].change_percent}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FREE: 7-day prediction chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                7일 예측
                <Badge variant="outline" className="text-xs">FREE</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions7d.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={predictions7d}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "신뢰구간") return [`${value?.toLocaleString()}원`];
                        return [`${value?.toLocaleString()}원`, name];
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidence_interval"
                      fill="#f97316"
                      fillOpacity={0.1}
                      stroke="none"
                      name="신뢰구간"
                    />
                    <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="예측가" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  예측 데이터가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>

          {/* FREE: Prediction table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">예측 상세 (7일)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">날짜</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">예측 가격</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">신뢰구간</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">변동률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions7d.map((item) => (
                      <tr key={item.date} className="border-b last:border-0">
                        <td className="py-2 px-3">{new Date(item.date).toLocaleDateString("ko-KR")}</td>
                        <td className="py-2 px-3 text-right font-mono-num font-medium">{item.price.toLocaleString()}원</td>
                        <td className="py-2 px-3 text-right text-xs text-muted-foreground">
                          {item.confidence_interval[0].toLocaleString()} ~ {item.confidence_interval[1].toLocaleString()}
                        </td>
                        <td className={cn(
                          "py-2 px-3 text-right font-medium",
                          item.change_percent > 0 ? "text-danger-500" : item.change_percent < 0 ? "text-success-500" : "text-muted-foreground"
                        )}>
                          {item.change_percent > 0 ? "+" : ""}{item.change_percent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* PRO teaser: 30-day & 60-day */}
          <Card className="border-dashed border-2">
            <CardContent className="py-8 text-center">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">30일 / 60일 예측</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Standard 구독 시 30일 예측, Pro 구독 시 60일 예측을 확인할 수 있습니다.
              </p>
              <Button className="bg-primary-400 hover:bg-primary-500 text-white" asChild>
                <Link href="/pricing">
                  구독 플랜 보기
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            예측 데이터를 불러올 수 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
