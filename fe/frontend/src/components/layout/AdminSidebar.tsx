'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react';
import { ADMIN_NAV } from '@/config/navigation';

/**
 * Sidebar khu quản trị: brand + nav từ config + nút về trang chủ.
 * Active theo pathname; ẩn trên màn hình nhỏ (topbar Tabs thay thế).
 */
export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-line bg-surface p-5 md:flex">
      <div>
        <div className="flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#0d9488] to-[#042f2e] text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-ink">
              Quản trị
            </span>
            <span className="block text-[10px] text-faint">Blog Platform</span>
          </span>
        </div>

        <nav className="mt-8 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-start gap-3 rounded-xl px-3.5 py-3 transition ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-raised hover:text-ink'
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-faint">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-medium text-muted transition hover:bg-raised hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Về trang độc giả
      </Link>
    </aside>
  );
}
