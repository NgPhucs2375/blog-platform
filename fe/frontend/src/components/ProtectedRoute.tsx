'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CircleNotch } from '@phosphor-icons/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Đảm bảo mã chỉ chạy logic riêng của client sau khi hydration hoàn tất
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (requiredRole && user.role?.toLowerCase() !== requiredRole.toLowerCase()) {
      router.replace('/');
    }
  }, [isMounted, isLoading, isAuthenticated, user, requiredRole, router]);

  // Trong quá trình SSR và lần đầu hydrate ở client, luôn hiển thị cùng 1 giao diện chờ
  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col gap-2 items-center">
          <CircleNotch className="animate-spin h-10 w-10 text-zinc-500" />
        </div>
      </div>
    );
  }

  // Chặn hiển thị nếu chưa đăng nhập hoặc sai vai trò
  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole && user.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;