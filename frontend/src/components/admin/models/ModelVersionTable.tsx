"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePromoteModel } from "@/lib/admin-queries";
import type { ModelVersionItem } from "@/types/admin";

export default function ModelVersionTable({ models, grade }: { models: ModelVersionItem[]; grade: string }) {
  const promoteMutation = usePromoteModel();

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">모델 버전 목록</h3>
        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">등록된 모델이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">버전</th>
                  <th className="pb-2 pr-4">최근 평가</th>
                  <th className="pb-2 pr-4">평균 MAPE</th>
                  <th className="pb-2 pr-4">평가 수</th>
                  <th className="pb-2 pr-4">상태</th>
                  <th className="pb-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.model_version} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m.model_version}</td>
                    <td className="py-2 pr-4">{m.latest_eval_date ?? "-"}</td>
                    <td className="py-2 pr-4">{m.avg_mape != null ? `${m.avg_mape}%` : "-"}</td>
                    <td className="py-2 pr-4">{m.eval_count}</td>
                    <td className="py-2 pr-4">
                      {m.is_production ? (
                        <Badge className="bg-green-600 text-white">Production</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </td>
                    <td className="py-2">
                      {!m.is_production && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={promoteMutation.isPending}
                          onClick={() => promoteMutation.mutate({ version: m.model_version, grade })}
                        >
                          프로모션
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
