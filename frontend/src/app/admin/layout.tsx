"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for auth hydration (token → /auth/me) before redirecting
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      // No token at all — redirect immediately
      router.replace("/login?redirect=/admin");
      return;
    }
    // Token exists — wait for AuthHydrator to populate user
    if (isAuthenticated && user) {
      setHydrated(true);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (user && user.role !== "admin" && user.role !== "analyst") {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user || (user.role !== "admin" && user.role !== "analyst")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
