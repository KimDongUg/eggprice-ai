"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LineChart, TrendingUp, Cpu, Database, AlertTriangle, Users, MessageSquare, Newspaper, FileText, Eye, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const menuSections = [
  {
    title: "AI 분석",
    items: [
      { href: "/admin", label: "예측 성능 대시보드", icon: BarChart3 },
      { href: "/admin/analysis", label: "예측 vs 실제 분석", icon: LineChart },
      { href: "/admin/market-factors", label: "시장요인 분석", icon: TrendingUp },
      { href: "/admin/error-analysis", label: "오차 분석", icon: AlertTriangle },
      { href: "/admin/models", label: "모델 관리", icon: Cpu },
      { href: "/admin/prices", label: "실제가격 관리", icon: Database },
    ],
  },
  {
    title: "서비스 관리",
    items: [
      { href: "/admin/users", label: "사용자 관리", icon: Users },
      { href: "/admin/visitor-stats", label: "접속자 통계", icon: Activity },
      { href: "/admin/page-views", label: "페이지뷰 통계", icon: Eye },
      { href: "/admin/community", label: "커뮤니티 관리", icon: MessageSquare },
      { href: "/admin/news", label: "뉴스 관리", icon: Newspaper },
      { href: "/admin/articles", label: "분석글 관리", icon: FileText },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 min-h-screen flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-700">
        <Link href="/admin" className="text-lg font-bold text-white">
          슬기알 <span className="text-sm font-normal text-gray-400">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-400/20 text-primary-300"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
