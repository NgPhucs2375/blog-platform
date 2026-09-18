'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FolderKanban,
  BarChart3,
  ShieldAlert,
  ArrowLeft,
  Shield,
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/users', label: 'Quản lý người dùng', icon: Users },
    { href: '/categories', label: 'Quản lý chuyên mục', icon: FolderKanban },
    { href: '/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
    { href: '/moderation-rules', label: 'Quy tắc kiểm duyệt', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 flex">
      {/* Sidebar Quản trị cố định */}
      <aside className="w-64 border-r border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#080c14] p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-700/10 text-red-700 dark:bg-red-600/20 dark:text-red-400">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
              Admin Panel
            </span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-700/15 dark:text-red-300 dark:border-red-600/30 shadow-sm'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Vùng nội dung các trang con */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
