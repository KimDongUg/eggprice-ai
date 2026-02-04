"use client";

import { useState } from "react";
import AlertForm from "@/components/alerts/AlertForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlerts, useDeleteAlert } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";
import { Trash2 } from "lucide-react";

export default function AlertsPage() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || "");
  const [searchEmail, setSearchEmail] = useState(user?.email || "");

  const { data: alerts = [], isLoading } = useAlerts(searchEmail);
  const deleteMutation = useDeleteAlert();

  const handleSearch = () => {
    if (email) setSearchEmail(email);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">알림 관리</h1>
        <p className="text-muted-foreground text-sm">
          예측 가격이 설정한 조건에 도달하면 이메일로 알려드립니다.
        </p>
      </div>

      <AlertForm onCreated={() => email && setSearchEmail(email)} />

      <Card>
        <CardHeader>
          <CardTitle>내 알림 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="이메일 주소를 입력하세요"
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !email}
              variant="secondary"
            >
              {isLoading ? "조회 중..." : "조회"}
            </Button>
          </div>

          {searchEmail && alerts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              등록된 알림이 없습니다.
            </p>
          )}

          {alerts.length > 0 && (
            <div className="divide-y divide-border">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {alert.grade} -{" "}
                      {alert.condition === "above" ? "이상" : "이하"}{" "}
                      {alert.threshold_price.toLocaleString()}원
                    </p>
                    <p className="text-xs text-muted-foreground">
                      등록일:{" "}
                      {new Date(alert.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
