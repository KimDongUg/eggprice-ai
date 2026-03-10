"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, Activity, Info, Database, MapPin, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const REGIONS = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
];

interface AccuracySummary {
  grade: string;
  region: string;
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
  const grade = "특란";
  const [region, setRegion] = useState("seoul");
  const [summary, setSummary] = useState<AccuracySummary | null>(null);
  const [history, setHistory] = useState<AccuracyHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/accuracy/summary", { params: { grade, region } }).then((r) => r.data),
      api.get("/accuracy/history", { params: { grade, region, days: 90 } }).then((r) => r.data),
      api.get("/accuracy/metrics", { params: { grade } }).then((r) => r.data),
    ])
      .then(([s, h, m]) => {
        setSummary(s);
        setHistory(h.items);
        setMetrics(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [region]);

  const regionName = REGIONS.find((r) => r.code === region)?.name ?? "서울";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">예측 정확도</h1>
        <p className="text-muted-foreground text-sm">
          AI 모델 예측 정확도를 투명하게 공개합니다 — 신뢰도의 핵심 근거
          <Badge variant="outline" className="ml-2 text-[10px] align-middle">특란 · KAMIS 도매 유통가 기준</Badge>
        </p>
      </div>

      {/* Region selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="h-4 w-4 text-primary-400 shrink-0" />
        <span className="text-sm font-medium">지역:</span>
        {REGIONS.map((r) => (
          <button
            key={r.code}
            onClick={() => setRegion(r.code)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              region === r.code
                ? "bg-primary-400 text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

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
                      <span className="text-sm font-medium text-muted-foreground">{label} ({regionName})</span>
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
              <CardTitle className="text-lg">예측 vs 실제 가격 비교 — {regionName} (최근 90일)</CardTitle>
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
                    <YAxis
                      domain={["dataMin - 200", "dataMax + 200"]}
                      tickFormatter={(v) => `${v.toLocaleString()}원`}
                      tick={{ fontSize: 12 }}
                    />
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
                <CardTitle className="text-lg">정확도 이력 — {regionName}</CardTitle>
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

          {/* MAPE 설명 + 사용 데이터 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MAPE 설명 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  MAPE란?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">MAPE (Mean Absolute Percentage Error)</strong>는
                  예측값과 실제값의 차이를 백분율로 나타낸 지표입니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-center">
                  MAPE = (1/n) × Σ |실제값 - 예측값| / |실제값| × 100%
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <Badge className="bg-success-50 text-success-500 text-[10px] mt-0.5 shrink-0">0~5%</Badge>
                    <span>매우 정확한 예측</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-blue-50 text-blue-600 text-[10px] mt-0.5 shrink-0">5~10%</Badge>
                    <span>양호한 예측</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-yellow-50 text-yellow-600 text-[10px] mt-0.5 shrink-0">10~20%</Badge>
                    <span>보통 수준의 예측</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-danger-50 text-danger-500 text-[10px] mt-0.5 shrink-0">20%+</Badge>
                    <span>개선이 필요한 예측</span>
                  </li>
                </ul>
                <p>
                  MAPE가 <strong className="text-foreground">낮을수록</strong> 예측이 정확합니다.
                  정확도(%) = 100% - MAPE 로 계산됩니다.
                </p>
              </CardContent>
            </Card>

            {/* 사용 데이터 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  예측에 사용하는 데이터
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">
                  슬기알 AI는 다양한 시장 데이터를 종합 분석하여 가격을 예측합니다.
                </p>
                <div className="space-y-2.5">
                  {[
                    { icon: "📊", label: "KAMIS 도매 유통가", desc: "전국 5대 도시 일일 계란 도매 시세" },
                    { icon: "🌾", label: "사료 가격 (배합사료)", desc: "aT 농산물유통정보 — 생산비의 핵심 변수" },
                    { icon: "💱", label: "원/달러 환율", desc: "한국은행 기준율 — 수입 사료·원자재에 영향" },
                    { icon: "🐔", label: "조류인플루엔자 현황", desc: "검역본부 발생 데이터 — 공급 충격 감지" },
                    { icon: "🌡️", label: "기상 데이터", desc: "기상청 평균 기온 — 산란율·수요 변동" },
                    { icon: "📦", label: "거래량 (다봄)", desc: "일일 거래 물량 — 수요/공급 균형 파악" },
                    { icon: "🚢", label: "계란 수입 데이터 (KATI)", desc: "월별 수입량·수입단가 — 해외 공급 변동 반영" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div>
                        <span className="text-foreground font-medium text-sm">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs border-t pt-3">
                  이 데이터들을 LSTM(장단기 기억 신경망) 모델에 입력하여 7일~60일 후 가격을 예측합니다.
                  모델은 매월 자동 재훈련되며, 새로운 데이터를 반영합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
