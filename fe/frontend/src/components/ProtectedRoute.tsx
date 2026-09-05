"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.push("/");
    }
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
