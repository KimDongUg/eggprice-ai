"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/mypage/ProfileCard";
import AlertManagementCard from "@/components/mypage/AlertManagementCard";
import { useAuthStore } from "@/stores/auth";
import { useMe } from "@/lib/queries";

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();
  const { data: me, isLoading, error } = useMe();

  useEffect(() => {
    if (me) {
      setUser({ id: me.id, email: me.email, name: me.name });
    }
  }, [me, setUser]);

  // If not logged in and token check fails, redirect
  useEffect(() => {
    if (!isLoading && error && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, error, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">
          로그인이 필요합니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">마이페이지</h1>
        <p className="text-muted-foreground text-sm">
          프로필 정보와 알림 구독을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfileCard user={me} />
        </div>
        <div className="lg:col-span-2">
          <AlertManagementCard email={me.email} />
        </div>
      </div>
    </div>
  );
}
