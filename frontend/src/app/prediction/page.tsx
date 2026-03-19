"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, Lock, ArrowRight,
  ShieldAlert, Activity, ShoppingCart, AlertTriangle, Info,
} from "lucide-react";
import { useForecast, useMultiRegionForecasts, usePredictionAnalysis } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, Legend,
} from "recharts";
import { MapPin } from "lucide-react";

const REGION_COLORS: Record<string, string> = {
  seoul: "#f97316", busan: "#3b82f6", daegu: "#10b981",
  gwangju: "#ec4899", daejeon: "#06b6d4",
};

const GRADE_OPTIONS = ["특란", "대란", "중란", "소란"];

const REGIONS = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
];

export default function PredictionPage() {
  const [selectedGrade, setSelectedGrade] = useState("특란");
  const [selectedRegion, setSelectedRegion] = useState("seoul");
  const { isAuthenticated } = useAuthStore();
  const { data: forecast, isLoading } = useForecast(selectedGrade, true, selectedRegion);
  const { data: multiForecasts, isLoading: multiLoading } = useMultiRegionForecasts(selectedGrade);
  const { data: analysis } = usePredictionAnalysis(selectedGrade, selectedRegion, isAuthenticated);

  const predictions7d = forecast?.predictions?.slice(0, 7) ?? [];
  const predictions30d = forecast?.predictions?.slice(0, 30) ?? [];
  const predictions60d = forecast?.predictions?.slice(0, 60) ?? [];
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
          <Badge variant="outline" className="ml-2 text-[10px] align-middle">KAMIS 도매 유통가 기준</Badge>
        </p>
      </div>

      {/* SEO text description */}
      <Card className="bg-gray-50/50">
        <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            슬기알 AI 가격 예측은 KAMIS 도매 유통가, 사료 가격, 원/달러 환율, 조류인플루엔자 발생 현황,
            기상 데이터, 계란 수입량 등 16개 시장 변수를 LSTM(장단기 기억 신경망) 딥러닝 모델에 입력하여 산출합니다.
          </p>
          <p>
            예측 결과에는 신뢰구간이 함께 제공되어 예측의 불확실성을 정량적으로 확인할 수 있습니다.
            AI 예측은 통계적 추정치이며, 실제 가격은 돌발 변수에 의해 달라질 수 있습니다.
          </p>
        </CardContent>
      </Card>

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
              {predictions7d.length > 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  예측 기준일{" "}
                  <span className="font-semibold text-foreground">
                    {new Date(predictions7d[0].date + "T00:00:00").toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                  </span>
                  {" ~ "}
                  <span className="font-semibold text-foreground">
                    {new Date(predictions7d[predictions7d.length - 1].date + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
                  </span>
                </p>
              )}
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
                {/* Show direction probability for logged-in users */}
                {isAuthenticated && analysis && (
                  <>
                    <div>
                      <span className="text-xs text-muted-foreground">상승 확률</span>
                      <p className="font-mono-num font-bold text-danger-500">{analysis.rise_probability}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">하락 확률</span>
                      <p className="font-mono-num font-bold text-success-500">{analysis.fall_probability}%</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logged-in: Analysis cards (volatility, buy signal, risk) */}
          {isAuthenticated && analysis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Volatility */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-medium text-muted-foreground">변동성 지수</span>
                  </div>
                  <div className="text-2xl font-bold font-mono-num">
                    {analysis.volatility_index}
                    <Badge className={cn(
                      "ml-2 text-xs",
                      analysis.volatility_label === "안정" ? "bg-success-50 text-success-500" :
                      analysis.volatility_label === "보통" ? "bg-yellow-50 text-yellow-600" :
                      "bg-danger-50 text-danger-500"
                    )}>
                      {analysis.volatility_label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">최근 30일 가격 변동 계수</p>
                </CardContent>
              </Card>

              {/* Buy signal */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-medium text-muted-foreground">구매 권장</span>
                  </div>
                  <div className="text-lg font-bold">
                    <Badge className={cn(
                      "text-sm",
                      analysis.buy_signal === "매수 추천" ? "bg-danger-50 text-danger-500" :
                      analysis.buy_signal === "매수 대기" ? "bg-success-50 text-success-500" :
                      analysis.buy_signal === "적정 구매" ? "bg-blue-50 text-blue-600" :
                      "bg-yellow-50 text-yellow-600"
                    )}>
                      {analysis.buy_signal}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{analysis.buy_reason}</p>
                </CardContent>
              </Card>

              {/* Risk alerts */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-medium text-muted-foreground">리스크 경고</span>
                  </div>
                  {analysis.risk_alerts.length > 0 ? (
                    <div className="space-y-2">
                      {analysis.risk_alerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          {alert.level === "warning" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-success-500 font-medium">특이사항 없음</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

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
              <CardTitle className="text-lg">
                예측 상세 (7일)
                {predictions7d.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {new Date(predictions7d[0].date + "T00:00:00").toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    {" ~ "}
                    {new Date(predictions7d[predictions7d.length - 1].date + "T00:00:00").toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </span>
                )}
              </CardTitle>
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

          {/* Logged-in: 30-day prediction chart */}
          {isAuthenticated ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    30일 예측 ({regionName})
                    <Badge className="bg-blue-50 text-blue-600 text-xs">Standard</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {predictions30d.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={predictions30d}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => {
                              const d = new Date(v);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                            tick={{ fontSize: 11 }}
                            interval={4}
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
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="confidence_interval"
                            fill="#f9731620"
                            stroke="none"
                            name="신뢰구간"
                            /* use first element as lower bound area */
                          />
                          <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} dot={false} name="예측가" />
                        </ComposedChart>
                      </ResponsiveContainer>
                      <div className="mt-3 overflow-x-auto max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-white">
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium text-muted-foreground">날짜</th>
                              <th className="text-right py-2 px-3 font-medium text-muted-foreground">예측가</th>
                              <th className="text-right py-2 px-3 font-medium text-muted-foreground">신뢰구간</th>
                              <th className="text-right py-2 px-3 font-medium text-muted-foreground">변동률</th>
                            </tr>
                          </thead>
                          <tbody>
                            {predictions30d.map((item) => (
                              <tr key={item.date} className="border-b last:border-0">
                                <td className="py-1.5 px-3 text-xs">{new Date(item.date).toLocaleDateString("ko-KR")}</td>
                                <td className="py-1.5 px-3 text-right font-mono-num text-xs">{item.price.toLocaleString()}원</td>
                                <td className="py-1.5 px-3 text-right text-xs text-muted-foreground">
                                  {item.confidence_interval[0].toLocaleString()} ~ {item.confidence_interval[1].toLocaleString()}
                                </td>
                                <td className={cn(
                                  "py-1.5 px-3 text-right text-xs font-medium",
                                  item.change_percent > 0 ? "text-danger-500" : item.change_percent < 0 ? "text-success-500" : "text-muted-foreground"
                                )}>
                                  {item.change_percent > 0 ? "+" : ""}{item.change_percent}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      30일 예측 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 60-day prediction chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    60일 예측 ({regionName})
                    <Badge className="bg-primary-50 text-primary-400 text-xs">Pro</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {predictions60d.length > 30 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={predictions60d}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                          tick={{ fontSize: 11 }}
                          interval={9}
                        />
                        <YAxis
                          domain={['dataMin - 300', 'dataMax + 300']}
                          tickFormatter={(v) => `${v.toLocaleString()}원`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [`${value?.toLocaleString()}원`, name]}
                          labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={false} name="예측가" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      60일 예측 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            /* Non-logged-in: Lock teaser */
            <Card className="border-dashed border-2">
              <CardContent className="py-8 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">30일 / 60일 예측 · AI 분석</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  로그인하시면 30일·60일 예측, 변동성 지수, 구매 권장 시점을 확인할 수 있습니다.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  상승/하락 확률 · 리스크 경고 · 구매 타이밍 추천
                </p>
                <Button className="bg-primary-400 hover:bg-primary-500 text-white" asChild>
                  <Link href="/login">
                    로그인하고 전체 예측 보기
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
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
