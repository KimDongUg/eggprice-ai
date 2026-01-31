"use client";

import { User, Mail, Calendar, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import type { UserResponse } from "@/types";

interface Props {
  user: UserResponse;
}

export default function ProfileCard({ user }: Props) {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-2">
          <User className="h-8 w-8 text-primary-400" />
        </div>
        <CardTitle className="text-lg">{user.name}</CardTitle>
        <Badge
          variant={user.is_active ? "success" : "secondary"}
          className="mx-auto mt-1"
        >
          {user.is_active ? "활성" : "비활성"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            가입일: {new Date(user.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">일반 회원</span>
        </div>

        <div className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
