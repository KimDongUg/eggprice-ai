"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/lib/queries";
import { useAuthStore } from "@/stores/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://eggprice-api-docker.onrender.com/api/v1";

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1C4.58 1 1 3.8 1 7.26c0 2.22 1.48 4.17 3.7 5.27-.16.6-.59 2.17-.68 2.5-.1.42.15.41.32.3.13-.09 2.1-1.43 2.95-2.01.55.08 1.12.12 1.71.12 4.42 0 8-2.8 8-6.18C17 3.8 13.42 1 9 1Z"
        fill="#000000"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path d="M12.13 9.36L5.59 0H0v18h5.87V8.64L12.41 18H18V0h-5.87v9.36Z" fill="white" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18">
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

  const redirectTo = searchParams.get("redirect") || "/";

  const handleSocialLogin = (provider: string) => {
    if (redirectTo !== "/") {
      localStorage.setItem("login_redirect", redirectTo);
    }
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
          router.push(redirectTo);
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
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      {/* Outer glow wrapper */}
      <div className="relative w-full max-w-[420px]">
        {/* Gradient border glow */}
        <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-b from-primary-400 via-primary-300 to-secondary-300 opacity-60 blur-sm" />
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-b from-primary-400 via-primary-300 to-secondary-300" />

        {/* Card */}
        <div className="relative bg-white rounded-3xl px-8 py-10 shadow-xl">
          {/* Top icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary-200 to-primary-100 flex items-center justify-center shadow-md">
              <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="36" rx="18" ry="22" fill="#FFC864" />
                <ellipse cx="32" cy="36" rx="18" ry="22" fill="url(#egg-grad)" />
                <ellipse cx="32" cy="38" rx="11" ry="13" fill="#FF9F43" opacity="0.6" />
                <circle cx="32" cy="36" r="7" fill="#FF6B35" opacity="0.8" />
                <defs>
                  <linearGradient id="egg-grad" x1="32" y1="14" x2="32" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFF3ED" />
                    <stop offset="1" stopColor="#FFC864" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            EggPrice AI
          </h1>

          {/* Welcome */}
          <h2 className="text-center text-[1.7rem] font-bold text-foreground mt-2">
            환영합니다
          </h2>

          {/* Subtitle */}
          <p className="text-center text-sm text-muted-foreground mt-2 mb-8">
            계란 가격 예측 서비스에 로그인하세요
          </p>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-[15px] font-medium transition-all hover:shadow-md border border-gray-200 bg-white text-gray-700"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>

            {/* Kakao */}
            <button
              type="button"
              onClick={() => handleSocialLogin("kakao")}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-[15px] font-semibold transition-all hover:shadow-md"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <KakaoIcon />
              카카오로 계속하기
            </button>

            {/* Naver */}
            <button
              type="button"
              onClick={() => handleSocialLogin("naver")}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: "#03C75A" }}
            >
              <NaverIcon />
              네이버로 계속하기
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* Email Login */}
          {!showEmailLogin ? (
            <button
              type="button"
              onClick={() => setShowEmailLogin(true)}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-[15px] font-medium transition-all hover:shadow-md border border-gray-200 bg-white text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              이메일로 로그인
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">이메일</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">비밀번호</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-[15px] font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3 mt-4">
              {error}
            </div>
          )}

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
