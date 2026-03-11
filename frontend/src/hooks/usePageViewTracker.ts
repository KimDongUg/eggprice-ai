"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/axios";

/**
 * Tracks page views for logged-in users (non-admin).
 * Call this once in the root layout.
 */
export function usePageViewTracker() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === "admin") return;
    if (pathname === lastPath.current) return;

    lastPath.current = pathname;

    api.post("/page-views", { path: pathname }).catch(() => {});
  }, [pathname, isAuthenticated, user]);
}
