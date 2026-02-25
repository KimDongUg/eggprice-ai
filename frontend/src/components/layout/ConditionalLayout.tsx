"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/axios";

/** Restore auth state from localStorage token on app mount */
function AuthHydrator() {
  const { setUser, isAuthenticated } = useAuthStore();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current || isAuthenticated) return;
    didRun.current = true;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data;
        setUser({
          id: u.id,
          email: u.email ?? "",
          name: u.name ?? "",
          role: u.role,
          profile_image: u.profile_image,
        });
      })
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      });
  }, [setUser, isAuthenticated]);

  return null;
}

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <AuthHydrator />
      {isAdmin ? (
        children
      ) : (
        <>
          <Header />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </>
      )}
    </>
  );
}
