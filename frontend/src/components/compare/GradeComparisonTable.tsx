"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPrices } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function GradeComparisonTable() {
  const { data: prices, isLoading } = useCurrentPrices();

  if (isLoading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!prices || prices.length === 0) return null;

  // Find the base grade (특란) for comparison
  const baseGrade = prices.find((p) => p.grade === "특란");
  const basePrice = baseGrade?.retail_price ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>등급별 가격 비교</CardTitle>
        <CardDescription>특란 기준 등급 간 가격 차이를 비교합니다.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                등급
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                소비자가
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                산지가
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                전일 대비
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                특란 대비
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {prices.map((p) => {
              const diffFromBase =
                basePrice && p.retail_price
                  ? p.retail_price - basePrice
                  : null;
              const isUp = p.daily_change !== null && p.daily_change > 0;
              const isDown = p.daily_change !== null && p.daily_change < 0;

              return (
                <tr key={p.grade} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold">{p.grade}</span>
                    {p.grade === "특란" && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                        기준
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono-num font-bold text-sm">
                      {p.retail_price?.toLocaleString() ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">원</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono-num text-sm text-muted-foreground">
                      {p.wholesale_price?.toLocaleString() ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-0.5">원</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div
                      className={cn(
                        "inline-flex items-center gap-0.5 text-sm font-medium",
                        isUp
                          ? "text-danger-500"
                          : isDown
                            ? "text-success-500"
                            : "text-muted-foreground"
                      )}
                    >
                      {isUp && <TrendingUp className="h-3 w-3" />}
                      {isDown && <TrendingDown className="h-3 w-3" />}
                      {!isUp && !isDown && <Minus className="h-3 w-3" />}
                      <span className="font-mono-num">
                        {p.daily_change_pct !== null
                          ? `${p.daily_change_pct > 0 ? "+" : ""}${p.daily_change_pct}%`
                          : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {diffFromBase !== null && diffFromBase !== 0 ? (
                      <span
                        className={cn(
                          "font-mono-num text-sm font-medium",
                          diffFromBase > 0 ? "text-danger-500" : "text-success-500"
                        )}
                      >
                        {diffFromBase > 0 ? "+" : ""}
                        {diffFromBase.toLocaleString()}원
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
