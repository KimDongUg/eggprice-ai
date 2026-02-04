"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/types";

interface Props {
  predictions: Prediction[];
  basePrice?: number;
}

const HORIZON_LABELS: Record<number, string> = {
  7: "7일 후",
  14: "14일 후",
  30: "30일 후",
};

export default function PredictionTable({ predictions, basePrice }: Props) {
  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          예측 데이터가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>예측 상세</CardTitle>
        <CardDescription>
          기준일: {predictions[0]?.base_date} | 모델:{" "}
          {predictions[0]?.model_version}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                예측 기간
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                예측일
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                예측 가격
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                90% 신뢰구간
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {predictions.map((pred, idx) => {
              const prevPrice =
                idx === 0 ? basePrice : predictions[idx - 1]?.predicted_price;
              const diff =
                prevPrice != null
                  ? Math.round(pred.predicted_price - prevPrice)
                  : null;

              return (
                <tr key={pred.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4 text-sm font-medium">
                    {HORIZON_LABELS[pred.horizon_days] ||
                      `${pred.horizon_days}일 후`}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {pred.target_date}
                  </td>
                  <td className="px-5 py-4 text-sm text-right">
                    <span className="font-semibold">
                      {pred.predicted_price.toLocaleString()}원
                    </span>
                    {diff != null && diff !== 0 && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 ml-2 text-xs font-medium",
                          diff > 0
                            ? "text-danger-500"
                            : "text-success-500"
                        )}
                      >
                        {diff > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {diff > 0 ? "+" : ""}
                        {diff.toLocaleString()}원
                      </span>
                    )}
                    {diff != null && diff === 0 && (
                      <span className="inline-flex items-center gap-0.5 ml-2 text-xs font-medium text-muted-foreground">
                        <Minus className="h-3 w-3" />
                        0원
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-right text-muted-foreground">
                    {pred.confidence_lower.toLocaleString()} ~{" "}
                    {pred.confidence_upper.toLocaleString()}원
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
