"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/axios";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("인증 정보를 받지 못했습니다.");
      setTimeout(() => router.push("/login"), 2000);
      return;
    }

    // Store tokens first so the axios interceptor can use them
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    // Fetch user info with the new token
    api
      .get("/auth/me")
      .then((res) => {
        const user = res.data;
        login(
          { access_token: accessToken, refresh_token: refreshToken },
          {
            id: user.id,
            email: user.email ?? "",
            name: user.name ?? user.email ?? "사용자",
            profile_image: user.profile_image,
          }
        );
        router.push("/");
      })
      .catch(() => {
        setError("사용자 정보를 불러오지 못했습니다.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setTimeout(() => router.push("/login"), 2000);
      });
  }, [login, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
