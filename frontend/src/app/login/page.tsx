"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://eggprice-api-docker.onrender.com/api/v1";

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1C4.58 1 1 3.8 1 7.26c0 2.22 1.48 4.17 3.7 5.27-.16.6-.59 2.17-.68 2.5-.1.42.15.41.32.3.13-.09 2.1-1.43 2.95-2.01.55.08 1.12.12 1.71.12 4.42 0 8-2.8 8-6.18C17 3.8 13.42 1 9 1Z"
        fill="#000000"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M12.13 9.36L5.59 0H0v18h5.87V8.64L12.41 18H18V0h-5.87v9.36Z" fill="white" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "소셜 로그인에 실패했습니다. 다시 시도해주세요." : null
  );

  const loginMutation = useLogin();
  const { login } = useAuthStore();

  const handleSocialLogin = (provider: string) => {
    window.location.href = `${API_BASE}/auth/${provider}/login`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(
            {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            },
            { id: data.user?.id ?? 0, email, name: data.user?.name ?? email }
          );
          router.push("/");
        },
        onError: (err) => {
          setError(
            err instanceof Error
              ? err.message
              : "로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요."
          );
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            EggPrice AI 서비스에 로그인하세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("kakao")}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: "#FEE500", color: "#000000" }}
            >
              <KakaoIcon />
              카카오로 시작하기
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin("naver")}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <NaverIcon />
              네이버로 시작하기
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: "#FFFFFF", color: "#374151", border: "1px solid #D1D5DB" }}
            >
              <GoogleIcon />
              Google로 시작하기
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* Email Login Toggle / Form */}
          {!showEmailLogin ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowEmailLogin(true)}
            >
              이메일로 로그인
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-primary hover:underline">
              회원가입
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
