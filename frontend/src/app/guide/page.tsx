import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import articles from "@/data/guide-articles";

export const metadata: Metadata = {
  title: "계란 지식백과 — 가격 구조·등급·유통·사료 영향·AI 예측 해설",
  description:
    "계란 가격이 결정되는 구조, 특란·대란·중란 등급 차이, 유통 과정, 사료가격의 영향, AI 예측 해설까지. 계란 시장을 이해하기 위한 필수 지식 30편.",
  keywords: [
    "계란 등급 차이",
    "특란 대란 차이",
    "계란 가격 구조",
    "계란 유통 구조",
    "사료 가격 영향",
    "계란 도매가",
    "계란 가격 예측",
    "AI 가격 예측",
  ],
};

const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "시장분석", value: "시장분석" },
  { label: "AI해설", value: "AI해설" },
  { label: "산업정보", value: "산업정보" },
  { label: "데이터해석", value: "데이터해석" },
];

const CATEGORY_COLOR: Record<string, string> = {
  시장분석: "bg-blue-50 text-blue-700",
  AI해설: "bg-purple-50 text-purple-700",
  산업정보: "bg-green-50 text-green-700",
  데이터해석: "bg-orange-50 text-orange-700",
};

const CATEGORY_ICON: Record<string, string> = {
  시장분석: "📈",
  AI해설: "🤖",
  산업정보: "📚",
  데이터해석: "📊",
};

export default function GuidePage() {
  // Group articles by category
  const grouped = CATEGORIES.filter((c) => c.value).map((cat) => ({
    ...cat,
    articles: articles.filter((a) => a.category === cat.value),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">계란 지식백과</h1>
        <p className="text-muted-foreground text-sm">
          계란 가격 구조, 등급 차이, 유통 과정, AI 예측 해설 등 계란 시장을 이해하기 위한 필수 지식 {articles.length}편
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {grouped.map((cat) => (
          <a key={cat.value} href={`#cat-${cat.value}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <span className="text-2xl">{CATEGORY_ICON[cat.value]}</span>
                <p className="text-sm font-semibold mt-1">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.articles.length}편</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* Articles by category */}
      {grouped.map((cat) => (
        <div key={cat.value} id={`cat-${cat.value}`}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>{CATEGORY_ICON[cat.value]}</span>
            {cat.label}
            <Badge variant="outline" className="text-xs">{cat.articles.length}편</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cat.articles.map((article) => (
              <Link key={article.slug} href={`/guide/${article.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-[10px] ${CATEGORY_COLOR[article.category]}`}>
                        {article.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {article.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary-50 to-orange-50 border-primary-100">
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-bold mb-2">
            이 지식을 바탕으로 AI가 가격을 예측합니다
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            사료가, 환율, 계절 수요, AI 발생 현황, 수입 데이터 등을 종합 분석하여 7일~60일 후 가격을 예측합니다.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/prediction"
              className="inline-flex items-center px-4 py-2 bg-primary-400 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors"
            >
              AI 예측 보기
            </Link>
            <Link
              href="/accuracy"
              className="inline-flex items-center px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              예측 정확도 확인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
