"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PriceWithChange } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  data: PriceWithChange;
}

export default function PriceSummaryCard({ data }: Props) {
  const isUp = data.daily_change !== null && data.daily_change > 0;
  const isDown = data.daily_change !== null && data.daily_change < 0;

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all",
        isUp && "border-danger-500/30",
        isDown && "border-success-500/30"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">{data.grade}</span>
          <span className="text-[10px] text-muted-foreground">{data.unit}</span>
        </div>

        {data.retail_price !== null && (
          <p className="font-mono-num text-2xl font-bold tracking-tight">
            {data.retail_price.toLocaleString()}
            <span className="text-xs font-sans font-normal text-muted-foreground ml-0.5">
              원
            </span>
          </p>
        )}

        {data.wholesale_price !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            산지{" "}
            <span className="font-mono-num font-medium text-foreground">
              {data.wholesale_price.toLocaleString()}
            </span>
            원
          </p>
        )}

        {data.daily_change !== null && (
          <div
            className={cn(
              "flex items-center gap-1 mt-2 text-sm font-semibold",
              isUp ? "text-danger-500" : isDown ? "text-success-500" : "text-muted-foreground"
            )}
          >
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : isDown ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span className="font-mono-num">
              {isUp ? "▲" : isDown ? "▼" : ""}
              {data.daily_change_pct !== null
                ? `${Math.abs(data.daily_change_pct)}%`
                : `${Math.abs(data.daily_change).toLocaleString()}원`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
