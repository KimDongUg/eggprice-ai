"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2 } from "lucide-react";
import api from "@/lib/axios";

interface AnalysisItem {
  id: number;
  title: string;
  category: string;
  seo_slug: string | null;
  source_name: string | null;
  published_at: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  "주간전망": "bg-blue-100 text-blue-700",
  "AI분석": "bg-purple-100 text-purple-700",
  "사료분석": "bg-green-100 text-green-700",
  "환율분석": "bg-orange-100 text-orange-700",
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AnalysisItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    api.get("/admin/articles", { params: { per_page: 100 } })
      .then((r) => {
        setArticles(r.data.items);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const deleteArticle = async (id: number) => {
    if (!confirm(`분석글 #${id}을(를) 삭제하시겠습니까?`)) return;
    await api.delete(`/admin/articles/${id}`);
    fetchArticles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          분석글 관리
        </h1>
        <Badge variant="secondary">{total}개 분석글</Badge>
      </div>

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
                    <th className="text-center py-3 px-4 font-medium w-24">카테고리</th>
                    <th className="text-left py-3 px-4 font-medium w-48">SEO 슬러그</th>
                    <th className="text-center py-3 px-4 font-medium w-24">출처</th>
                    <th className="text-center py-3 px-4 font-medium w-28">날짜</th>
                    <th className="text-center py-3 px-4 font-medium w-16">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-center text-muted-foreground">{a.id}</td>
                      <td className="py-3 px-4 font-medium">{a.title}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={CATEGORY_COLOR[a.category] || "bg-gray-100 text-gray-700"}>
                          {a.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                        {a.seo_slug || "-"}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {a.source_name || "-"}
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
    </div>
  );
}
