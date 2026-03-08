"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, BarChart3, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";

const GRADE_OPTIONS = ["특란", "대란", "중란", "소란"];

interface AccuracySummary {
  grade: string;
  periods: Record<string, { mape: number | null; accuracy: number | null; sample_count: number }>;
}

interface AccuracyHistoryItem {
  date: string;
  predicted: number;
  actual: number;
  error: number;
  error_pct: number | null;
}

interface ModelMetrics {
  grade: string;
  model_version: string | null;
  mape: number | null;
  rmse: number | null;
  mae: number | null;
  directional_accuracy: number | null;
  eval_date: string | null;
}

export default function AccuracyPage() {
  const [grade, setGrade] = useState("특란");
  const [summary, setSummary] = useState<AccuracySummary | null>(null);
  const [history, setHistory] = useState<AccuracyHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/accuracy/summary", { params: { grade } }).then((r) => r.data),
      api.get("/accuracy/history", { params: { grade, days: 90 } }).then((r) => r.data),
      api.get("/accuracy/metrics", { params: { grade } }).then((r) => r.data),
    ])
      .then(([s, h, m]) => {
        setSummary(s);
        setHistory(h.items);
        setMetrics(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">예측 정확도</h1>
        <p className="text-muted-foreground text-sm">
          AI 모델 예측 정확도를 투명하게 공개합니다 — 신뢰도의 핵심 근거
        </p>
      </div>

      <Tabs value={grade} onValueChange={setGrade}>
        <TabsList>
          {GRADE_OPTIONS.map((g) => (
            <TabsTrigger key={g} value={g}>{g}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      ) : (
        <>
          {/* Accuracy summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["30d", "90d", "180d"] as const).map((period) => {
              const label = period === "30d" ? "최근 30일" : period === "90d" ? "최근 90일" : "최근 180일";
              const data = summary?.periods[period];
              return (
                <Card key={period}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">{label}</span>
                      <CheckCircle2 className="h-4 w-4 text-success-500" />
                    </div>
                    <div className="text-3xl font-bold font-mono-num">
                      {data?.accuracy != null ? `${data.accuracy}%` : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      MAPE: {data?.mape != null ? `${data.mape}%` : "-"} | 샘플: {data?.sample_count ?? 0}건
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Model metrics */}
          {metrics && metrics.model_version && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-400" />
                  모델 성능 지표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">MAPE</span>
                    <span className="text-xl font-bold font-mono-num">{metrics.mape != null ? `${metrics.mape.toFixed(2)}%` : "-"}</span>
                    <span className="text-xs text-muted-foreground block">평균 절대 백분율 오차</span>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">RMSE</span>
                    <span className="text-xl font-bold font-mono-num">{metrics.rmse != null ? `${metrics.rmse.toFixed(0)}원` : "-"}</span>
                    <span className="text-xs text-muted-foreground block">평균 제곱근 오차</span>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">MAE</span>
                    <span className="text-xl font-bold font-mono-num">{metrics.mae != null ? `${metrics.mae.toFixed(0)}원` : "-"}</span>
                    <span className="text-xs text-muted-foreground block">평균 절대 오차</span>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">방향 정확도</span>
                    <span className="text-xl font-bold font-mono-num">{metrics.directional_accuracy != null ? `${(metrics.directional_accuracy * 100).toFixed(1)}%` : "-"}</span>
                    <span className="text-xs text-muted-foreground block">상승/하락 방향 적중률</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-right">
                  모델 버전: {metrics.model_version} | 평가일: {metrics.eval_date ?? "-"}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Predicted vs Actual chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">예측 vs 실제 가격 비교 (최근 90일)</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
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
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value?.toLocaleString()}원`, name]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("ko-KR")}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" name="예측가" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="actual" name="실제가" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  정확도 데이터가 아직 충분하지 않습니다.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error history table */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">정확도 이력</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">날짜</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">예측가</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">실제가</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">오차(원)</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">오차(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((item) => (
                        <tr key={item.date} className="border-b last:border-0">
                          <td className="py-2 px-3">{new Date(item.date).toLocaleDateString("ko-KR")}</td>
                          <td className="py-2 px-3 text-right font-mono-num">{item.predicted.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono-num">{item.actual.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono-num">{item.error.toLocaleString()}</td>
                          <td className={cn(
                            "py-2 px-3 text-right font-mono-num",
                            (item.error_pct ?? 0) > 5 ? "text-danger-500" : "text-success-500"
                          )}>
                            {item.error_pct != null ? `${item.error_pct}%` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
