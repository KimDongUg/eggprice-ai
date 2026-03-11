"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, BarChart3 } from "lucide-react";
import api from "@/lib/axios";

interface PageStat {
  path: string;
  count: number;
}

interface UserPageStat {
  user_id: number;
  email: string | null;
  name: string | null;
  provider: string;
  total_views: number;
  pages: PageStat[];
}

interface Stats {
  total_users: number;
  total_views: number;
  users: UserPageStat[];
}

export default function AdminPageViewsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    api.get("/page-views/stats")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Eye className="h-5 w-5" />
        페이지뷰 통계
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : stats ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">추적 사용자</p>
                  <p className="text-2xl font-bold">{stats.total_users}명</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 페이지뷰</p>
                  <p className="text-2xl font-bold">{stats.total_views.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-user breakdown */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium">사용자</th>
                    <th className="text-left py-3 px-4 font-medium">이메일</th>
                    <th className="text-center py-3 px-4 font-medium">로그인</th>
                    <th className="text-center py-3 px-4 font-medium">총 조회</th>
                    <th className="text-center py-3 px-4 font-medium">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((u) => (
                    <>
                      <tr key={u.user_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{u.name || `User #${u.user_id}`}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{u.email || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-xs">{u.provider}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{u.total_views}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                            className="text-xs text-primary-400 hover:underline"
                          >
                            {expandedUser === u.user_id ? "접기" : "펼치기"}
                          </button>
                        </td>
                      </tr>
                      {expandedUser === u.user_id && (
                        <tr key={`${u.user_id}-detail`} className="bg-gray-50">
                          <td colSpan={5} className="px-8 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                              {u.pages.map((p) => (
                                <div key={p.path} className="flex justify-between bg-white rounded px-3 py-1.5 text-xs border">
                                  <span className="text-muted-foreground truncate mr-2">{p.path}</span>
                                  <span className="font-bold shrink-0">{p.count}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground text-center py-12">데이터를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
