'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SignOut, SquaresFour, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';

interface UserMenuProps {
  /** Hiển thị khối tên + vai trò cạnh avatar hay chỉ avatar */
  compact?: boolean;
}

/** Menu tài khoản: avatar bấm mở panel hồ sơ / bảng điều khiển / đăng xuất. */
export default function UserMenu({ compact = false }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  if (!user) return null;

  const username =
    user.userName || (user as any)?.username || 'Tác giả';
  const role = user.role || 'User';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu tài khoản"
        className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 shadow-sm transition ${
          open
            ? 'border-accent/50 bg-accent-soft'
            : 'border-line bg-surface hover:border-accent/40'
        } ${compact ? 'flex-row-reverse text-right' : ''}`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#0d9488] to-[#042f2e] text-[11px] font-bold text-white">
          {username.charAt(0).toUpperCase()}
        </span>
        {!compact && (
          <span className="hidden flex-col items-start leading-none sm:flex">
            <span className="max-w-[120px] truncate text-xs font-bold text-ink">
              {username}
            </span>
            <span className="mt-0.5 text-[10px] text-faint">{role}</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              aria-hidden
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/10"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-bold text-ink">{username}</p>
                <p className="mt-0.5 text-[11px] text-faint">{role}</p>
              </div>
              <div className="p-1.5">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted transition hover:bg-raised hover:text-ink"
                >
                  <UserCircle className="h-4 w-4" /> Hồ sơ cá nhân
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-muted transition hover:bg-raised hover:text-ink"
                >
                  <SquaresFour className="h-4 w-4" /> Bảng điều khiển
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <SignOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
