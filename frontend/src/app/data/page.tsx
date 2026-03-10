"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Lock, Database, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const GRADE_OPTIONS = ["특란", "대란", "중란", "소란"];

const REGIONS = [
  { code: "seoul", name: "서울" },
  { code: "busan", name: "부산" },
  { code: "daegu", name: "대구" },
  { code: "gwangju", name: "광주" },
  { code: "daejeon", name: "대전" },
];

interface YearlyItem {
  year: number;
  avg_wholesale: number | null;
  avg_retail: number | null;
  data_count: number;
}

interface MonthlyItem {
  year: number;
  month: number;
  avg_wholesale: number | null;
  avg_retail: number | null;
  min_wholesale: number | null;
  max_wholesale: number | null;
  data_count: number;
}

export default function DataPage() {
  const [grade, setGrade] = useState("특란");
  const [selectedRegion, setSelectedRegion] = useState("seoul");
  const [view, setView] = useState<"yearly" | "monthly">("yearly");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (view === "yearly") {
      api.get("/data/yearly", { params: { grade, region: selectedRegion } })
        .then((r) => setYearlyData(r.data.items))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      api.get("/data/monthly", { params: { grade, region: selectedRegion, ...(selectedYear ? { year: selectedYear } : {}) } })
        .then((r) => setMonthlyData(r.data.items))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [grade, view, selectedYear, selectedRegion]);

  const availableYears = yearlyData.map((d) => d.year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">가격 데이터</h1>
        <p className="text-muted-foreground text-sm">
          연도별 · 월별 · 등급별 계란 가격 히스토리 데이터
        </p>
      </div>

      {/* 지역 선택 */}
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

      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={grade} onValueChange={setGrade}>
          <TabsList>
            {GRADE_OPTIONS.map((g) => (
              <TabsTrigger key={g} value={g}>{g}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <button
            onClick={() => setView("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "yearly" ? "bg-primary-400 text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            )}
          >
            연도별
          </button>
          <button
            onClick={() => setView("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "monthly" ? "bg-primary-400 text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            )}
          >
            월별
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[400px] rounded-xl" />
      ) : view === "yearly" ? (
        <>
          {/* Yearly chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary-400" />
                연도별 평균 가격
                <Badge variant="outline" className="text-xs gap-1"><MapPin className="h-3 w-3" />{REGIONS.find((r) => r.code === selectedRegion)?.name ?? "서울"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${v.toLocaleString()}원`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value?.toLocaleString()}원`]} />
                    <Legend />
                    <Bar dataKey="avg_wholesale" name="도매가 평균" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avg_retail" name="소비자가 평균" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">데이터가 없습니다.</div>
              )}
            </CardContent>
          </Card>

          {/* Yearly table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium">연도</th>
                      <th className="text-right py-3 px-4 font-medium">도매가 평균</th>
                      <th className="text-right py-3 px-4 font-medium">소비자가 평균</th>
                      <th className="text-right py-3 px-4 font-medium">데이터 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.slice().reverse().map((item) => (
                      <tr
                        key={item.year}
                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setView("monthly"); setSelectedYear(item.year); }}
                      >
                        <td className="py-3 px-4 font-medium">{item.year}년</td>
                        <td className="py-3 px-4 text-right font-mono-num">{item.avg_wholesale?.toLocaleString() ?? "-"}원</td>
                        <td className="py-3 px-4 text-right font-mono-num">{item.avg_retail?.toLocaleString() ?? "-"}원</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{item.data_count}건</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Year selector for monthly view */}
          {availableYears.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedYear(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  !selectedYear ? "bg-primary-400 text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                )}
              >
                전체
              </button>
              {availableYears.slice().reverse().map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    selectedYear === y ? "bg-primary-400 text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  )}
                >
                  {y}년
                </button>
              ))}
            </div>
          )}

          {/* Monthly table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">월별 평균 가격</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium">기간</th>
                      <th className="text-right py-3 px-4 font-medium">도매가 평균</th>
                      <th className="text-right py-3 px-4 font-medium">소비자가 평균</th>
                      <th className="text-right py-3 px-4 font-medium">최저</th>
                      <th className="text-right py-3 px-4 font-medium">최고</th>
                      <th className="text-right py-3 px-4 font-medium">데이터 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.slice().reverse().map((item) => (
                      <tr key={`${item.year}-${item.month}`} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.year}년 {item.month}월</td>
                        <td className="py-3 px-4 text-right font-mono-num">{item.avg_wholesale?.toLocaleString() ?? "-"}원</td>
                        <td className="py-3 px-4 text-right font-mono-num">{item.avg_retail?.toLocaleString() ?? "-"}원</td>
                        <td className="py-3 px-4 text-right font-mono-num text-muted-foreground">{item.min_wholesale?.toLocaleString() ?? "-"}</td>
                        <td className="py-3 px-4 text-right font-mono-num text-muted-foreground">{item.max_wholesale?.toLocaleString() ?? "-"}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground">{item.data_count}건</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* CSV download — PRO only */}
      <Card className="border-dashed border-2">
        <CardContent className="py-6 text-center">
          <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">CSV 데이터 다운로드</p>
          <p className="text-xs text-muted-foreground mb-3">PRO 구독 이상에서 사용할 수 있습니다.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">구독 플랜 보기</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-3.5 w-3.5" />
        데이터 출처: KAMIS (한국농수산식품유통공사) 도매 유통가 기준
      </div>
    </div>
  );
}
