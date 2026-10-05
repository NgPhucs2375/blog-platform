'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV } from '@/config/navigation';
import AdminSidebar from '@/components/layout/AdminSidebar';
import NotificationsBell from '@/components/layout/NotificationsBell';
import UserMenu from '@/components/layout/UserMenu';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Tabs from '@/components/layout/Tabs';

/**
 * Shell khu quản trị: AdminSidebar (desktop) + topbar với Tabs đồng bộ
 * route (thay thế sidebar trên mobile) + bell, theme, user menu.
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const current =
    ADMIN_NAV.find((item) => pathname.startsWith(item.href)) ?? ADMIN_NAV[0];

  return (
    <div className="flex min-h-screen bg-canvas">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        {/* Topbar */}
        <div className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {current.label}
              </p>
              <p className="hidden truncate text-[11px] text-faint sm:block">
                {current.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <NotificationsBell />
              <ThemeToggle />
              <UserMenu compact />
            </div>
          </div>

          {/* Tabs đồng bộ route — nav chính trên mobile */}
          <div className="border-t border-line px-4 py-2 sm:px-6 lg:px-8">
            <Tabs
              items={ADMIN_NAV.map((item) => ({
                id: item.href,
                label: item.label,
                href: item.href,
                icon: item.icon,
              }))}
              activeId={pathname}
              layoutId="admin-tabs"
            />
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
