"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Lock, ArrowRight } from "lucide-react";
import { useForecast, useMultiRegionForecasts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Legend,
} from "recharts";
import { MapPin } from "lucide-react";

const REGION_COLORS: Record<string, string> = {
  seoul: "#f97316", busan: "#3b82f6", daegu: "#10b981", incheon: "#8b5cf6",
  gwangju: "#ec4899", daejeon: "#06b6d4", gyeonggi: "#f59e0b", gangwon: "#6366f1",
  chungcheong: "#14b8a6", jeolla: "#e11d48", gyeongsang: "#84cc16", jeju: "#a855f7",
};

const GRADE_OPTIONS = ["특란", "대란", "중란", "소란"];

const REGIONS = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
  { code: "incheon", name: "인천" },
  { code: "gyeonggi", name: "경기" },
  { code: "chungcheong", name: "충청" },
  { code: "jeolla", name: "전라" },
  { code: "gyeongsang", name: "경상" },
  { code: "gangwon", name: "강원" },
  { code: "jeju", name: "제주" },
];

export default function PredictionPage() {
  const [selectedGrade, setSelectedGrade] = useState("특란");
  const [selectedRegion, setSelectedRegion] = useState("seoul");
  const { data: forecast, isLoading } = useForecast(selectedGrade, true, selectedRegion);
  const { data: multiForecasts, isLoading: multiLoading } = useMultiRegionForecasts(selectedGrade);

  const predictions7d = forecast?.predictions?.slice(0, 7) ?? [];
  const predictions30d = forecast?.predictions?.slice(0, 30) ?? [];
  const regionName = REGIONS.find((r) => r.code === selectedRegion)?.name ?? "서울";

  // Build multi-region comparison data (7-day)
  const multiRegionChartData = (() => {
    if (!multiForecasts) return [];
    const dateMap = new Map<string, Record<string, string | number>>();
    for (const region of REGIONS) {
      const preds = multiForecasts[region.code]?.predictions?.slice(0, 7) ?? [];
      for (const p of preds) {
        const row = dateMap.get(p.date) ?? { date: p.date };
        row[region.code] = p.price;
        dateMap.set(p.date, row);
      }
    }
    return Array.from(dateMap.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">AI 가격 예측</h1>
        <p className="text-muted-foreground text-sm">
          머신러닝 기반 계란 가격 단기·중기 예측 정보
          <Badge variant="outline" className="ml-2 text-[10px] align-middle">KAMIS 도매가 기준</Badge>
        </p>
      </div>

      {/* Region selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
        <span className="text-sm font-medium">지역:</span>
        {REGIONS.map((region) => (
          <button
            key={region.code}
            onClick={() => setSelectedRegion(region.code)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              selectedRegion === region.code
                ? "bg-primary-400 text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            )}
          >
            {region.name}
          </button>
        ))}
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
                    <span className="text-xs text-muted-foreground">현재 도매가</span>
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

          {/* FREE: 7-day prediction chart — all regions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                7일 예측
                <Badge variant="outline" className="text-xs">FREE</Badge>
                <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />전국</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {multiLoading ? (
                <Skeleton className="h-[350px]" />
              ) : multiRegionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={multiRegionChartData}>
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
                      domain={['dataMin - 200', 'dataMax + 200']}
                      tickFormatter={(v) => `${v.toLocaleString()}원`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const regionLabel = REGIONS.find((r) => r.code === name)?.name ?? name;
                        return [`${value?.toLocaleString()}원`, regionLabel];
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                    />
                    <Legend
                      formatter={(value) => REGIONS.find((r) => r.code === value)?.name ?? value}
                      wrapperStyle={{ fontSize: "0.75rem" }}
                    />
                    {REGIONS.map((region) => (
                      <Line
                        key={region.code}
                        type="monotone"
                        dataKey={region.code}
                        stroke={REGION_COLORS[region.code]}
                        strokeWidth={region.code === selectedRegion ? 3 : 1.5}
                        strokeOpacity={region.code === selectedRegion ? 1 : 0.5}
                        dot={region.code === selectedRegion ? { r: 4 } : false}
                        name={region.code}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : predictions7d.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
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
                    <YAxis
                      domain={['dataMin - 200', 'dataMax + 200']}
                      tickFormatter={(v) => `${v.toLocaleString()}원`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value?.toLocaleString()}원`, name]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                    />
                    <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="예측가" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
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
