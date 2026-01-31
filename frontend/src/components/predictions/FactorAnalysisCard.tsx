"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsFactors } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface Props {
  grade: string;
}

const FACTOR_ICONS: Record<string, string> = {
  "가격 추세": "📊",
  "조류독감": "🦠",
  "사료 가격": "🌽",
  "환율": "💱",
  "기온": "🌡️",
};

export default function FactorAnalysisCard({ grade }: Props) {
  const { data, isLoading } = useAnalyticsFactors(grade);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">가격 변동 요인 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.factors.map((factor) => {
            const icon = FACTOR_ICONS[factor.factor] || "📌";
            const directionColor =
              factor.direction === "상승"
                ? "text-danger-500"
                : factor.direction === "하락"
                  ? "text-success-500"
                  : "text-muted-foreground";

            return (
              <div
                key={factor.factor}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <span className="text-lg">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{factor.factor}</span>
                    <Badge
                      variant={
                        factor.direction === "상승"
                          ? "destructive"
                          : factor.direction === "하락"
                            ? "success"
                            : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {factor.direction === "상승" && (
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {factor.direction === "하락" && (
                        <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {factor.direction === "중립" && (
                        <Minus className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {factor.direction}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {factor.description}
                  </p>
                </div>
                {factor.value !== null && (
                  <span className={cn("font-mono-num text-sm font-medium", directionColor)}>
                    {typeof factor.value === "number" && factor.factor === "가격 추세"
                      ? `${factor.value > 0 ? "+" : ""}${factor.value}%`
                      : factor.value.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          기준일: {data.date}
        </p>
      </CardContent>
    </Card>
  );
}
