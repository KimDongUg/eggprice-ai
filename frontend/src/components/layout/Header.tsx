"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, User, Menu, X, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", authRequired: false, authOnly: false },
  { href: "/price", label: "오늘 가격", authRequired: false, authOnly: false },
  { href: "/prediction", label: "AI 예측", authRequired: false, authOnly: false },
  { href: "/accuracy", label: "예측 정확도", authRequired: false, authOnly: false },
  { href: "/news", label: "뉴스", authRequired: false, authOnly: false },
  { href: "/analysis", label: "시장 분석", authRequired: false, authOnly: false },
  { href: "/data", label: "가격 데이터", authRequired: false, authOnly: false },
  { href: "/compare", label: "가격 비교", authRequired: false, authOnly: false },
  { href: "/community", label: "커뮤니티", authRequired: false, authOnly: false },
  { href: "/mypage", label: "마이페이지", authRequired: true, authOnly: true },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (item: typeof navItems[number], e: React.MouseEvent) => {
    if (item.authRequired && !isAuthenticated) {
      e.preventDefault();
      router.push(`/login?redirect=${encodeURIComponent(item.href)}`);
    }
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="슬기알 로고"
              width={40}
              height={40}
              className="shrink-0"
            />
            <span className="text-lg font-bold text-gray-900">
              슬기알
              <span className="text-xs font-medium text-muted-foreground ml-1">EggPrice AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems
              .filter((item) => !item.authOnly || isAuthenticated)
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary-50 text-primary-400"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="ml-3 pl-3 border-l flex items-center gap-2">
              <Button
                size="sm"
                className="bg-primary-400 hover:bg-primary-500 text-white"
                asChild
              >
                <a href="tel:010-0000-0000">
                  <Phone className="h-3.5 w-3.5 mr-1" />
                  상담 신청
                </a>
              </Button>
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {user?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-1">
            {navItems
              .filter((item) => !item.authOnly || isAuthenticated)
              .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  handleNavClick(item, e);
                  setMobileOpen(false);
                }}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary-50 text-primary-400"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t mt-2 space-y-2">
              <Button
                size="sm"
                className="w-full bg-primary-400 hover:bg-primary-500 text-white"
                asChild
              >
                <a href="tel:010-0000-0000">
                  <Phone className="h-3.5 w-3.5 mr-1" />
                  상담 신청
                </a>
              </Button>
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  로그아웃
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    로그인
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
