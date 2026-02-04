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

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">예측정확도</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            아직 모델 평가 데이터가 없습니다.<br />
            매월 1일 자동 평가 후 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: "MAE",
      value: data.mae.toFixed(1),
      unit: "원",
      target: 100,
      ok: data.mae <= 100,
      desc: "예측과 실제 가격의 평균 차이 (낮을수록 정확)\n예: 실제 7,400원, 예측 7,300원 → 오차 100원\n목표: 100원 이하",
    },
    {
      label: "RMSE",
      value: data.rmse.toFixed(1),
      unit: "원",
      target: 150,
      ok: data.rmse <= 150,
      desc: "큰 오차에 더 민감한 평균 오차 (낮을수록 안정적)\n예: 오차가 50원, 50원이면 RMSE=50 / 오차가 10원, 90원이면 RMSE≈64\n목표: 150원 이하",
    },
    {
      label: "MAPE",
      value: data.mape.toFixed(2),
      unit: "%",
      target: 5,
      ok: data.mape <= 5,
      desc: "실제 가격 대비 오차 비율 (낮을수록 정확)\n예: 실제 7,400원, 예측 7,300원 → 100/7400 ≈ 1.35%\n목표: 5% 이하",
    },
    {
      label: "방향 정확도",
      value: data.directional_accuracy.toFixed(1),
      unit: "%",
      target: 70,
      ok: data.directional_accuracy >= 70,
      desc: "가격 상승·하락 방향을 맞춘 비율 (높을수록 좋음)\n예: 10일 중 8일의 방향을 맞추면 → 80%",
      highlight: true,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">예측정확도</CardTitle>
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
              <p className={cn(
                "uppercase tracking-wider",
                m.highlight
                  ? "text-xs font-bold text-foreground"
                  : "text-[10px] text-muted-foreground"
              )}>
                {m.label}
              </p>
              <p
                className={cn(
                  "font-mono-num font-bold mt-1",
                  m.highlight ? "text-2xl" : "text-xl",
                  m.highlight
                    ? "text-primary"
                    : m.ok ? "text-success-700" : "text-danger-700"
                )}
              >
                {m.value}
                <span className={cn("font-normal", m.highlight ? "text-sm" : "text-xs")}>{m.unit}</span>
              </p>
              <p className={cn(
                "mt-1 leading-relaxed whitespace-pre-line",
                m.highlight
                  ? "text-xs font-medium text-foreground/70"
                  : "text-[10px] text-muted-foreground"
              )}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-muted-foreground text-right space-y-0.5">
          <p>평가일: {data.eval_date}</p>
          <p>* 모델 정확도는 매월 1일 과거 실제 가격과 비교하여 자동 평가됩니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
