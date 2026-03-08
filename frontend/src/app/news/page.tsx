"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, Clock, ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";

const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "가격", value: "가격" },
  { label: "산업", value: "산업" },
  { label: "사료", value: "사료" },
];

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  published_at: string;
  seo_slug: string;
  thumbnail: string | null;
}

export default function NewsPage() {
  const [category, setCategory] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/news", { params: category ? { category } : {} })
      .then((r) => setNews(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">뉴스</h1>
        <p className="text-muted-foreground text-sm">계란 가격, 양계 산업, 사료 가격 관련 최신 뉴스</p>
      </div>

      {/* Category filter */}
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
      </div>

      {/* News list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.published_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Newspaper className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">뉴스가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* AdSense placeholder */}
      <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-4 text-center">
        <span className="text-xs text-muted-foreground">광고 영역 (Google AdSense)</span>
      </div>
    </div>
  );
}
