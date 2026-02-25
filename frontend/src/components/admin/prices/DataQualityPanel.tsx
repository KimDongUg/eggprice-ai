"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDataQuality } from "@/lib/admin-queries";

export default function DataQualityPanel({ grade }: { grade: string }) {
  const { data, isLoading } = useDataQuality(grade);

  const counts = {
    missing: data?.filter((d) => d.check_type === "missing").length ?? 0,
    outlier: data?.filter((d) => d.check_type === "outlier").length ?? 0,
    gap: data?.filter((d) => d.check_type === "gap").length ?? 0,
  };

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">데이터 품질 점검</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">로딩 중...</p>
        ) : (
          <>
            <div className="flex gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{counts.missing}</p>
                <p className="text-xs text-muted-foreground">결측</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{counts.outlier}</p>
                <p className="text-xs text-muted-foreground">이상치</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{counts.gap}</p>
                <p className="text-xs text-muted-foreground">공백</p>
              </div>
            </div>
            {data && data.length > 0 ? (
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">유형</th>
                      <th className="pb-2 pr-4">심각도</th>
                      <th className="pb-2 pr-4">날짜</th>
                      <th className="pb-2">설명</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4">{item.check_type}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={item.severity === "error" ? "destructive" : "secondary"}>
                            {item.severity === "error" ? "오류" : "경고"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{item.date ?? "-"}</td>
                        <td className="py-2 text-muted-foreground">{item.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-green-600 text-center py-2">품질 이슈가 없습니다</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
