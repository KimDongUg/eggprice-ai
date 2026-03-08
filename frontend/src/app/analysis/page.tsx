"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Clock, ExternalLink, RefreshCw } from "lucide-react";
import api from "@/lib/axios";

const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "주간전망", value: "주간전망" },
  { label: "AI분석", value: "AI분석" },
  { label: "사료분석", value: "사료분석" },
  { label: "환율분석", value: "환율분석" },
];

interface AnalysisItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  source: string | null;
  source_name: string | null;
  published_at: string;
  seo_slug: string;
}

export default function AnalysisPage() {
  const [category, setCategory] = useState("");
  const [articles, setArticles] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get("/analysis", { params: category ? { category } : {} })
      .then((r) => {
        setArticles(r.data.items);
        setTotal(r.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">시장 분석</h1>
        <p className="text-muted-foreground text-sm">
          주간/월간 심층 분석 — 계란 가격 영향 요인 분석 기사
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          매일 자동 수집 · 전문 분석 기사 큐레이션
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((item) => (
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
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">분석 기사가 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">
              매일 오전 7시, 오후 7시에 자동으로 분석 기사를 수집합니다.
            </p>
          </CardContent>
        </Card>
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
