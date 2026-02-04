"use client";

import { useState } from "react";
import PredictionChart from "@/components/predictions/PredictionChart";
import PredictionTable from "@/components/predictions/PredictionTable";
import FactorAnalysisCard from "@/components/predictions/FactorAnalysisCard";
import PredictionAccuracyCard from "@/components/predictions/PredictionAccuracyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { usePredictions, usePriceHistory, useForecast } from "@/lib/queries";
import { GRADES } from "@/types";
import { cn } from "@/lib/utils";

export default function PredictionsPage() {
  const [selectedGrade, setSelectedGrade] = useState<string>("특란");

  const { data: predData, isLoading: predLoading } = usePredictions(selectedGrade);
  const { data: history, isLoading: histLoading } = usePriceHistory(selectedGrade, 180);
  const { data: forecast } = useForecast(selectedGrade);

  const isLoading = predLoading || histLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">상세 예측</h1>
        <p className="text-muted-foreground text-sm">
          등급별 AI 가격 예측, 신뢰구간, 변동 요인을 확인하세요.
        </p>
      </div>

      <Tabs value={selectedGrade} onValueChange={setSelectedGrade}>
        <TabsList>
          {GRADES.map((grade) => (
            <TabsTrigger key={grade} value={grade}>
              {grade}
            </TabsTrigger>
          ))}
        </TabsList>

        {GRADES.map((grade) => (
          <TabsContent key={grade} value={grade} className="space-y-6">
            {/* Forecast trend summary */}
            {forecast && (
              <Card className="bg-gradient-to-r from-card to-accent/20 border-primary-400/20">
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        추세:
                      </span>
                      <Badge
                        className={cn(
                          "gap-1",
                          forecast.trend === "상승"
                            ? "bg-danger-50 text-danger-500 border-danger-500/20"
                            : forecast.trend === "하락"
                              ? "bg-success-50 text-success-500 border-success-500/20"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {forecast.trend === "상승" && <TrendingUp className="h-3 w-3" />}
                        {forecast.trend === "하락" && <TrendingDown className="h-3 w-3" />}
                        {forecast.trend === "보합" && <Minus className="h-3 w-3" />}
                        {forecast.trend}
                      </Badge>
                    </div>
                    {forecast.current_price && (
                      <div>
                        <span className="text-xs text-muted-foreground">현재가</span>
                        <p className="font-mono-num font-bold">
                          {forecast.current_price.toLocaleString()}원
                        </p>
                      </div>
                    )}
                    {[
                      { idx: 6, label: "7일" },
                      { idx: 13, label: "14일" },
                      { idx: 29, label: "30일" },
                    ]
                      .filter(({ idx }) => idx < forecast.predictions.length)
                      .map(({ idx, label }) => {
                        const item = forecast.predictions[idx];
                        return (
                          <div key={idx}>
                            <span className="text-xs text-muted-foreground">
                              {label} 후
                            </span>
                            <p className="font-mono-num font-bold">
                              {item.price.toLocaleString()}원
                              <span
                                className={cn(
                                  "text-xs ml-1 font-semibold",
                                  item.change_percent > 0
                                    ? "text-danger-500"
                                    : item.change_percent < 0
                                      ? "text-success-500"
                                      : "text-muted-foreground"
                                )}
                              >
                                {item.change_percent > 0 ? "+" : ""}
                                {item.change_percent}%
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    {forecast.alert && (
                      <p className="text-sm text-muted-foreground italic">
                        {forecast.alert}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart + Table */}
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            ) : (
              <>
                <PredictionChart
                  history={history || []}
                  predictions={predData?.predictions || []}
                />
                <PredictionTable
                  predictions={predData?.predictions || []}
                  basePrice={forecast?.current_price ?? undefined}
                />
              </>
            )}

            {/* Factor Analysis + Accuracy side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FactorAnalysisCard grade={selectedGrade} />
              <PredictionAccuracyCard grade={selectedGrade} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
