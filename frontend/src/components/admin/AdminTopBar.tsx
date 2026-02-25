"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";

export default function AdminTopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          공개 사이트 <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{user?.name || user?.email}</span>
          <Badge variant="secondary" className="text-xs">
            {user?.role === "admin" ? "관리자" : "분석가"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
