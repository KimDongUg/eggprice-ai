"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "대시보드", authRequired: false, authOnly: false },
  { href: "/predictions", label: "상세 예측", authRequired: true, authOnly: false },
  { href: "/compare", label: "가격 비교", authRequired: false, authOnly: false },
  { href: "/alerts", label: "알림 설정", authRequired: true, authOnly: false },
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
    <header className="bg-card border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              {/* Egg shape */}
              <ellipse cx="16" cy="17" rx="11" ry="13" fill="#FFC864" />
              <ellipse cx="16" cy="17" rx="11" ry="13" fill="url(#egg-grad)" />
              {/* AI circuit lines */}
              <circle cx="16" cy="14" r="3" fill="#1a56db" />
              <circle cx="10" cy="20" r="2" fill="#1a56db" opacity="0.8" />
              <circle cx="22" cy="20" r="2" fill="#1a56db" opacity="0.8" />
              <line x1="16" y1="17" x2="10" y2="20" stroke="#1a56db" strokeWidth="1.2" opacity="0.6" />
              <line x1="16" y1="17" x2="22" y2="20" stroke="#1a56db" strokeWidth="1.2" opacity="0.6" />
              <circle cx="16" cy="14" r="1.2" fill="#fff" />
              <circle cx="10" cy="20" r="0.8" fill="#fff" />
              <circle cx="22" cy="20" r="0.8" fill="#fff" />
              <defs>
                <linearGradient id="egg-grad" x1="16" y1="4" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFF3D6" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#FFC864" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold text-primary-400">
              계란가격 예측
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
            <div className="pt-2 border-t mt-2 flex gap-2">
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
