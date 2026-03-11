import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import articles, { getArticleBySlug } from "@/data/guide-articles";

// SSG: pre-render all article pages at build time
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = getArticleBySlug(params.slug);
  if (!article)
    return { title: "글을 찾을 수 없습니다" };
  return {
    title: article.title,
    description: article.description,
    keywords: [
      article.title,
      "계란 가격",
      "슬기알",
      article.category,
    ],
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
    },
  };
}

const CATEGORY_COLOR: Record<string, string> = {
  시장분석: "bg-blue-50 text-blue-700",
  AI해설: "bg-purple-50 text-purple-700",
  산업정보: "bg-green-50 text-green-700",
  데이터해석: "bg-orange-50 text-orange-700",
};

export default function GuideArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  // Schema.org Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      "@type": "Organization",
      name: "슬기알",
      url: "https://eggprice.kr",
    },
    publisher: {
      "@type": "Organization",
      name: "슬기알(계란가격예측 AI)",
      url: "https://eggprice.kr",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/guide"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary-400 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          지식백과 목록
        </Link>

        {/* Article header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={CATEGORY_COLOR[article.category] ?? ""}>
              {article.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(article.publishedAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            {article.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {article.description}
          </p>
        </div>

        {/* Article body */}
        <Card>
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {article.content}
            </div>
          </CardContent>
        </Card>

        {/* Data source note */}
        <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
          <p>
            데이터 출처: KAMIS(한국농수산식품유통공사), aT, 한국은행, 검역본부, 기상청, KATI
          </p>
          <p>
            슬기알 AI 예측은 통계적 추정치이며, 실제 가격은 달라질 수 있습니다.
            예측 정보는 의사결정의 참고 자료로만 활용하시기 바랍니다.
          </p>
        </div>

        {/* Related links */}
        <Card className="bg-gray-50">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">관련 페이지</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/prediction"
                className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                AI 가격 예측
              </Link>
              <Link
                href="/accuracy"
                className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                예측 정확도
              </Link>
              <Link
                href="/price"
                className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                오늘 가격
              </Link>
              <Link
                href="/data"
                className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                가격 데이터
              </Link>
              <Link
                href="/data-sources"
                className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                데이터 출처
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
