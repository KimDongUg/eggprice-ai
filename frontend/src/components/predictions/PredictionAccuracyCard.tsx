"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentModel } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface Props {
  grade: string;
}

export default function PredictionAccuracyCard({ grade }: Props) {
  const { data, isLoading } = useCurrentModel(grade);

  if (isLoading) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  if (!data) return null;

  const metrics = [
    {
      label: "MAE",
      value: data.mae.toFixed(1),
      unit: "원",
      target: 100,
      ok: data.mae <= 100,
    },
    {
      label: "RMSE",
      value: data.rmse.toFixed(1),
      unit: "원",
      target: 150,
      ok: data.rmse <= 150,
    },
    {
      label: "MAPE",
      value: data.mape.toFixed(2),
      unit: "%",
      target: 5,
      ok: data.mape <= 5,
    },
    {
      label: "방향 정확도",
      value: data.directional_accuracy.toFixed(1),
      unit: "%",
      target: 70,
      ok: data.directional_accuracy >= 70,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">과거 예측 정확도</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {data.model_version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={cn(
                "rounded-lg p-3 text-center",
                m.ok ? "bg-success-50" : "bg-danger-50"
              )}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {m.label}
              </p>
              <p
                className={cn(
                  "font-mono-num text-xl font-bold mt-1",
                  m.ok ? "text-success-700" : "text-danger-700"
                )}
              >
                {m.value}
                <span className="text-xs font-normal">{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          평가일: {data.eval_date}
        </p>
      </CardContent>
    </Card>
  );
}
