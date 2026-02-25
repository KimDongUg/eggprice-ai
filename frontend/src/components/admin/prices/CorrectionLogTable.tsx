"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCorrectionLogs } from "@/lib/admin-queries";

export default function CorrectionLogTable() {
  const { data, isLoading } = useCorrectionLogs();

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-4">수정 로그 (감사 추적)</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">로딩 중...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">수정 내역이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4">일시</th>
                  <th className="pb-2 pr-4">필드</th>
                  <th className="pb-2 pr-4">변경 전</th>
                  <th className="pb-2 pr-4">변경 후</th>
                  <th className="pb-2 pr-4">사유</th>
                  <th className="pb-2">수정자 ID</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString("ko")}</td>
                    <td className="py-2 pr-4">{log.field}</td>
                    <td className="py-2 pr-4">{log.old_value ?? "-"}</td>
                    <td className="py-2 pr-4 font-medium">{log.new_value ?? "-"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{log.reason ?? "-"}</td>
                    <td className="py-2">{log.corrected_by}</td>
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
