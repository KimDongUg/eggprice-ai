"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ModelPerformance } from "@/types";

interface Props {
  data: ModelPerformance | null;
}

export default function ModelPerformanceCard({ data }: Props) {
  if (!data) return null;

  const metrics = [
    {
      label: "MAE",
      value: `${data.mae.toFixed(1)}원`,
      target: "≤ 100",
      ok: data.mae <= 100,
    },
    {
      label: "RMSE",
      value: `${data.rmse.toFixed(1)}원`,
      target: "≤ 150",
      ok: data.rmse <= 150,
    },
    {
      label: "MAPE",
      value: `${data.mape.toFixed(2)}%`,
      target: "≤ 5%",
      ok: data.mape <= 5,
    },
    {
      label: "방향성 정확도",
      value: `${data.directional_accuracy.toFixed(1)}%`,
      target: "≥ 70%",
      ok: data.directional_accuracy >= 70,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>모델 성능</CardTitle>
          <Badge variant="secondary">{data.model_version}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p
                className={`text-lg font-bold ${
                  m.ok ? "text-green-600" : "text-red-500"
                }`}
              >
                {m.value}
              </p>
              <p className="text-xs text-muted-foreground">목표 {m.target}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-right">
          평가일: {data.eval_date}
        </p>
      </CardContent>
    </Card>
  );
}
