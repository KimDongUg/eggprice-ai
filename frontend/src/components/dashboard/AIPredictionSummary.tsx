"use client";

import { Bot, TrendingUp, TrendingDown, Lightbulb, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ForecastResponse } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  data: ForecastResponse;
}

export default function AIPredictionSummary({ data }: Props) {
  const trendColor =
    data.trend === "상승"
      ? "text-danger-500"
      : data.trend === "하락"
        ? "text-success-500"
        : "text-muted-foreground";

  const trendBg =
    data.trend === "상승"
      ? "bg-danger-50"
      : data.trend === "하락"
        ? "bg-success-50"
        : "bg-muted";

  // Generate recommendation text
  const recommendation =
    data.trend === "상승"
      ? "가격 상승이 예상됩니다. 지금이 구매 적기입니다!"
      : data.trend === "하락"
        ? "가격 하락이 예상됩니다. 조금 더 기다려보세요."
        : "가격이 안정세를 보이고 있습니다.";

  return (
    <Card className="border-primary-400/20 bg-gradient-to-br from-card to-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary-400" />
            AI 예측 (특란 기준-서울)
          </CardTitle>
          <Badge className={cn(trendBg, trendColor, "border-0")}>
            {data.trend === "상승" && <TrendingUp className="h-3 w-3 mr-1" />}
            {data.trend === "하락" && <TrendingDown className="h-3 w-3 mr-1" />}
            {data.trend}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prediction rows: 7일 / 14일 / 30일 */}
        <div className="space-y-2">
          {[
            { idx: 6, label: "7일 후" },
            { idx: 13, label: "14일 후" },
            { idx: 29, label: "30일 후" },
          ]
            .filter(({ idx }) => idx < data.predictions.length)
            .map(({ idx, label }) => {
              const item = data.predictions[idx];
              const pctColor =
                item.change_percent > 0
                  ? "text-danger-500"
                  : item.change_percent < 0
                    ? "text-success-500"
                    : "text-muted-foreground";
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">{label}:</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-num font-bold text-lg">
                      {item.price.toLocaleString()}원
                    </span>
                    <span className={cn("font-mono-num text-sm font-semibold", pctColor)}>
                      ({item.change_percent > 0 ? "▲" : item.change_percent < 0 ? "▼" : ""}
                      {Math.abs(item.change_percent)}%)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Tips */}
        <div className="space-y-2 pt-2">
          {data.alert && (
            <div className="flex items-start gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-secondary-400 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{data.alert}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <Bell className="h-4 w-4 text-primary-400 mt-0.5 shrink-0" />
            <span className="font-medium">{recommendation}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
