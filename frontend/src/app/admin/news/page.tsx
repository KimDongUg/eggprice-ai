"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Trash2, MessageSquareText } from "lucide-react";
import api from "@/lib/axios";

interface NewsItem {
  id: number;
  title: string;
  category: string;
  source_name: string | null;
  published_at: string;
  has_commentary: boolean;
}

const CATEGORY_COLOR: Record<string, string> = {
  "가격": "bg-orange-100 text-orange-700",
  "산업": "bg-blue-100 text-blue-700",
  "사료": "bg-green-100 text-green-700",
  "정책": "bg-purple-100 text-purple-700",
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchNews = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get("/admin/news", { params: { page, per_page: 30 } })
      .then((r) => {
        setArticles(r.data.items);
        setTotal(r.data.total);
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || err.message || "뉴스 목록을 불러오지 못했습니다.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const deleteArticle = async (id: number) => {
    if (!confirm(`뉴스 #${id}을(를) 삭제하시겠습니까?`)) return;
    await api.delete(`/admin/news/${id}`);
    fetchNews();
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          뉴스 관리
        </h1>
        <Badge variant="secondary">{total}개 기사</Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center py-3 px-4 font-medium w-16">ID</th>
                    <th className="text-left py-3 px-4 font-medium">제목</th>
                    <th className="text-center py-3 px-4 font-medium w-20">카테고리</th>
                    <th className="text-center py-3 px-4 font-medium w-24">출처</th>
                    <th className="text-center py-3 px-4 font-medium w-16">해설</th>
                    <th className="text-center py-3 px-4 font-medium w-28">날짜</th>
                    <th className="text-center py-3 px-4 font-medium w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-center text-muted-foreground">{a.id}</td>
                      <td className="py-3 px-4 font-medium truncate max-w-[300px]">{a.title}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={CATEGORY_COLOR[a.category] || "bg-gray-100 text-gray-700"}>
                          {a.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {a.source_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {a.has_commentary ? (
                          <MessageSquareText className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {a.published_at ? new Date(a.published_at).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-danger-500 hover:text-danger-600"
                          onClick={() => deleteArticle(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  );
}
