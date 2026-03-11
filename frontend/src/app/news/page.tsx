"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Clock, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, MessageSquareText } from "lucide-react";
import api from "@/lib/axios";

const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "가격", value: "가격" },
  { label: "산업", value: "산업" },
  { label: "사료", value: "사료" },
];

const PER_PAGE = 10;

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  source: string | null;
  source_name: string | null;
  commentary: string | null;
  published_at: string;
  seo_slug: string;
}

export default function NewsPage() {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get("/news", { params: { ...(category ? { category } : {}), page, limit: PER_PAGE } })
      .then((r) => {
        setNews(r.data.items);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, page]);

  // Reset page when category changes
  const handleCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">뉴스</h1>
        <p className="text-muted-foreground text-sm">
          계란 가격, 양계 산업, 사료 가격 관련 최신 뉴스
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          매일 자동 수집 · 네이버 뉴스 기반
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === cat.value
                ? "bg-primary-400 text-white"
                : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
        {total > 0 && (
          <span className="self-center text-xs text-muted-foreground ml-2">
            총 {total}건
          </span>
        )}
      </div>

      {/* News list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.source || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {item.source_name && (
                          <span className="text-xs font-medium text-primary-400">
                            {item.source_name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.published_at).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                      {item.commentary && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-start gap-2">
                            <MessageSquareText className="h-3.5 w-3.5 text-primary-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {item.commentary}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-6" />
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">뉴스가 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">
              매일 오전 7시, 오후 7시에 자동으로 최신 뉴스를 수집합니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dot-${i}`} className="px-1 text-muted-foreground text-sm">...</span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="sm"
                  className={page === p ? "bg-primary-400 text-white" : ""}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* AdSense placeholder */}
      <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-4 text-center">
        <span className="text-xs text-muted-foreground">
          광고 영역 (Google AdSense)
        </span>
      </div>
    </div>
  );
}
