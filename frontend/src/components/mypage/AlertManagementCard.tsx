"use client";

import { Bell, Trash2, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlerts, useDeleteAlert } from "@/lib/queries";
import Link from "next/link";

interface Props {
  email: string;
}

export default function AlertManagementCard({ email }: Props) {
  const { data: alerts = [], isLoading } = useAlerts(email);
  const deleteMutation = useDeleteAlert();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary-400" />
              내 알림 구독
            </CardTitle>
            <CardDescription>
              등록된 가격 알림을 관리합니다.
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/alerts" className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              새 알림
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              등록된 알림이 없습니다.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/alerts">알림 등록하기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      alert.is_active ? "bg-success-500" : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{alert.grade}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {alert.condition === "above" ? "이상" : "이하"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono-num font-medium">
                        {alert.threshold_price.toLocaleString()}
                      </span>
                      원 |{" "}
                      {new Date(alert.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(alert.id)}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground text-right pt-2">
              총 {alerts.length}개의 알림
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
