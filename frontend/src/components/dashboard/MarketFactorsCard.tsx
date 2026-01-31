"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketDataSnapshot } from "@/types";

interface Props {
  data: MarketDataSnapshot | null;
}

export default function MarketFactorsCard({ data }: Props) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          시장 데이터를 불러오는 중...
        </CardContent>
      </Card>
    );
  }

  const factors = [
    {
      label: "거래량",
      value: data.volume ? `${(data.volume / 1000).toFixed(0)}톤` : "-",
      icon: "📦",
    },
    {
      label: "사료가 (옥수수)",
      value: data.corn_price
        ? `${data.corn_price.toLocaleString()}원/kg`
        : "-",
      icon: "🌽",
    },
    {
      label: "환율 (USD/KRW)",
      value: data.exchange_rate
        ? `${data.exchange_rate.toLocaleString()}원`
        : "-",
      icon: "💱",
    },
    {
      label: "조류독감",
      value: data.avian_flu ? "발생" : "정상",
      icon: "🦠",
      alert: data.avian_flu,
    },
    {
      label: "평균 기온",
      value: data.temperature !== null ? `${data.temperature}°C` : "-",
      icon: "🌡️",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>외부 시장 요인</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {factors.map((f) => (
            <div key={f.label} className="text-center space-y-1">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              {f.alert ? (
                <Badge variant="destructive">{f.value}</Badge>
              ) : (
                <p className="text-sm font-semibold">{f.value}</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-right">
          기준일: {data.date}
        </p>
      </CardContent>
    </Card>
  );
}
