"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ForecastResponse } from "@/types";

interface Props {
  data: ForecastResponse;
}

export default function ForecastSummaryCard({ data }: Props) {
  const trendIcon =
    data.trend === "상승" ? (
      <TrendingUp className="h-5 w-5 text-red-500" />
    ) : data.trend === "하락" ? (
      <TrendingDown className="h-5 w-5 text-blue-500" />
    ) : (
      <Minus className="h-5 w-5 text-gray-400" />
    );

  const trendVariant =
    data.trend === "상승"
      ? "destructive"
      : data.trend === "하락"
        ? "secondary"
        : "outline";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          {trendIcon}
          AI 예측 요약 ({data.grade})
        </CardTitle>
        <Badge variant={trendVariant as "default"}>{data.trend}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-6">
          {data.current_price && (
            <div>
              <p className="text-xs text-muted-foreground">현재 가격</p>
              <p className="text-lg font-bold">
                {data.current_price.toLocaleString()}원
              </p>
            </div>
          )}
          {data.predictions.map((item, i) => (
            <div key={i}>
              <p className="text-xs text-muted-foreground">{item.date}</p>
              <p className="text-lg font-semibold">
                {item.price.toLocaleString()}원
              </p>
              <p
                className={`text-xs font-medium ${
                  item.change_percent > 0
                    ? "text-red-600"
                    : item.change_percent < 0
                      ? "text-blue-600"
                      : "text-muted-foreground"
                }`}
              >
                {item.change_percent > 0 ? "+" : ""}
                {item.change_percent}%
              </p>
            </div>
          ))}
        </div>
        {data.alert && (
          <p className="text-sm text-muted-foreground mt-3 border-t pt-3">
            {data.alert}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
