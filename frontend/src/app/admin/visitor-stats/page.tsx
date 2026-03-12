"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  Clock,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/axios";

interface DailyStat {
  date: string;
  unique_visitors: number;
  page_views: number;
}

interface HourlyStat {
  hour: number;
  page_views: number;
}

interface PopularPage {
  path: string;
  views: number;
  unique_visitors: number;
}

interface VisitorStats {
  today_visitors: number;
  today_views: number;
  yesterday_visitors: number;
  yesterday_views: number;
  total_visitors: number;
  total_views: number;
  daily: DailyStat[];
  hourly: HourlyStat[];
  popular_pages: PopularPage[];
}

const PAGE_LABELS: Record<string, string> = {
  "/": "홈",
  "/dashboard": "대시보드",
  "/community": "커뮤니티",
  "/analysis": "AI 분석",
  "/news": "뉴스",
  "/alerts": "알림 설정",
  "/egg-price-today": "오늘의 계란값",
  "/accuracy": "예측 정확도",
  "/ai-model": "AI 모델 소개",
  "/compare": "가격 비교",
  "/data": "데이터 출처",
  "/about": "소개",
  "/contact": "문의",
  "/login": "로그인",
  "/register": "회원가입",
};

function getPageLabel(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (path.startsWith("/community/")) return "커뮤니티 글";
  if (path.startsWith("/guide/")) return "가이드";
  return path;
}

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center text-xs font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export default function VisitorStatsPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    api.get("/page-views/visitor-stats", { params: { days } })
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> 접속자 통계
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> 접속자 통계
        </h1>
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // Format daily chart data - show shorter date labels
  const dailyData = stats.daily.map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  // Hourly chart data
  const hourlyData = stats.hourly.map((h) => ({
    ...h,
    label: `${h.hour}시`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> 접속자 통계
        </h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border rounded-lg px-3 py-1.5 bg-white"
        >
          <option value={7}>최근 7일</option>
          <option value={14}>최근 14일</option>
          <option value={30}>최근 30일</option>
          <option value={90}>최근 90일</option>
          <option value={180}>최근 180일</option>
          <option value={365}>최근 1년</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">오늘 방문자</span>
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.today_visitors}명</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">어제 대비</span>
              <ChangeIndicator current={stats.today_visitors} previous={stats.yesterday_visitors} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">오늘 페이지뷰</span>
              <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                <Eye className="h-4.5 w-4.5 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.today_views.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">어제 대비</span>
              <ChangeIndicator current={stats.today_views} previous={stats.yesterday_views} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">전체 방문자</span>
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.total_visitors}명</p>
            <span className="text-xs text-muted-foreground">누적 순 방문자</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">전체 페이지뷰</span>
              <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-4.5 w-4.5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{stats.total_views.toLocaleString()}</p>
            <span className="text-xs text-muted-foreground">누적 총 조회수</span>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> 일별 방문 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradUV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={days <= 14 ? 0 : days <= 30 ? 2 : Math.floor(days / 15)}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "unique_visitors" ? "순 방문자" : "페이지뷰",
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value) => (value === "unique_visitors" ? "순 방문자" : "페이지뷰")}
              />
              <Area
                type="monotone"
                dataKey="unique_visitors"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradUV)"
              />
              <Area
                type="monotone"
                dataKey="page_views"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#gradPV)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> 시간대별 방문 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value.toLocaleString()}회`, "페이지뷰"]}
                />
                <Bar dataKey="page_views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> 인기 페이지 TOP 10
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2.5 px-4 font-medium text-xs">#</th>
                  <th className="text-left py-2.5 px-4 font-medium text-xs">페이지</th>
                  <th className="text-center py-2.5 px-4 font-medium text-xs">조회수</th>
                  <th className="text-center py-2.5 px-4 font-medium text-xs">방문자</th>
                </tr>
              </thead>
              <tbody>
                {stats.popular_pages.slice(0, 10).map((p, idx) => (
                  <tr key={p.path} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs">{getPageLabel(p.path)}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{p.path}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-xs">{p.views.toLocaleString()}</td>
                    <td className="py-2 px-4 text-center text-xs text-muted-foreground">{p.unique_visitors}</td>
                  </tr>
                ))}
                {stats.popular_pages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      아직 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
