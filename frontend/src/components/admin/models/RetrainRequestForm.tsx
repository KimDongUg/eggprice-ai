"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRequestRetrain, useRetrainRequests } from "@/lib/admin-queries";
import { GRADES } from "@/types";

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-yellow-100 text-yellow-800", label: "대기" },
  running: { className: "bg-blue-100 text-blue-800", label: "실행 중" },
  completed: { className: "bg-green-100 text-green-800", label: "완료" },
  failed: { className: "bg-red-100 text-red-800", label: "실패" },
};

export default function RetrainRequestForm() {
  const [grade, setGrade] = useState("대란");
  const [reason, setReason] = useState("");
  const mutation = useRequestRetrain();
  const { data: requests } = useRetrainRequests();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ grade, reason: reason || undefined });
    setReason("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">재학습 요청</h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <Label htmlFor="retrain-grade">등급</Label>
              <select
                id="retrain-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="retrain-reason">사유</Label>
              <Input
                id="retrain-reason"
                placeholder="재학습 사유 (선택)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "요청 중..." : "재학습 요청"}
            </Button>
          </form>
          {mutation.isSuccess && <p className="text-sm text-green-600 mt-2">요청이 등록되었습니다.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">재학습 요청 목록</h3>
          {!requests || requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">요청 내역이 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2 pr-4">등급</th>
                    <th className="pb-2 pr-4">사유</th>
                    <th className="pb-2 pr-4">상태</th>
                    <th className="pb-2 pr-4">결과 MAPE</th>
                    <th className="pb-2">요청일시</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
                    return (
                      <tr key={req.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">#{req.id}</td>
                        <td className="py-2 pr-4">{req.grade}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{req.reason ?? "-"}</td>
                        <td className="py-2 pr-4">
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </td>
                        <td className="py-2 pr-4">{req.result_mape != null ? `${req.result_mape}%` : "-"}</td>
                        <td className="py-2 whitespace-nowrap">{new Date(req.created_at).toLocaleString("ko")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
