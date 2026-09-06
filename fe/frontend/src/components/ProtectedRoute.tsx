"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState, EmptyState, Button } from "@/components/ui";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const denied = !!requiredRole && user?.role !== requiredRole;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (denied) {
      const t = setTimeout(() => router.push("/"), 1500);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, denied, router]);

  if (!isAuthenticated) return <LoadingState message="Đang kiểm tra phiên đăng nhập..." />;
  if (denied) {
    return (
      <EmptyState
        message="Bạn không có quyền truy cập trang quản trị."
        action={
          <Button variant="outline" size="sm" onClick={() => router.push("/")}>
            Về trang chủ
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
