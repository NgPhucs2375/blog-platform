'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bell, Checks } from '@phosphor-icons/react';
import {
  GUEST_NOTIFICATIONS,
  NOTIFICATION_META,
  SEED_NOTIFICATIONS,
  type AppNotification,
} from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Chuông thông báo với dropdown panel.
 * Dữ liệu đang là mock từ config/navigation.ts — khi BE có
 * /v1/notifications thì thay state nội bộ bằng fetch là xong.
 */
export default function NotificationsBell() {
  const { user } = useAuth() as { user?: unknown };
  const [open, setOpen] = useState(false);
  // Khách: thông báo chào mừng; đã đăng nhập: thông báo cá nhân (mock -> BE sau)
  const [items, setItems] = useState<AppNotification[]>(
    typeof window === 'undefined' ? SEED_NOTIFICATIONS : [],
  );
  const [hydrated, setHydrated] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setItems(user ? SEED_NOTIFICATIONS : GUEST_NOTIFICATIONS);
    setHydrated(true);
  }, [user]);

  const unreadCount = hydrated ? items.filter((n) => !n.read).length : 0;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Thông báo, ${unreadCount} chưa đọc`
            : 'Thông báo'
        }
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted shadow-sm transition hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-ink">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Lớp bắt click ra ngoài */}
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
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/10"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-bold text-ink">Thông báo</p>
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition hover:text-accent-hover"
                >
                  <Checks className="h-3.5 w-3.5" /> Đọc hết
                </button>
              </div>

              <div className="scroll-slim max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-faint">
                    Chưa có thông báo nào.
                  </p>
                ) : (
                  items.map((n) => {
                    const meta = NOTIFICATION_META[n.type];
                    const Icon = meta.icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-line px-4 py-3 last:border-0 ${
                          n.read ? 'opacity-60' : ''
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${meta.cls}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="line-clamp-1 text-xs font-bold text-ink">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span
                                aria-label="chưa đọc"
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                              />
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted">
                            {n.detail}
                          </span>
                          <span className="mt-1 block text-[10px] text-faint">
                            {meta.label} · {n.time}
                          </span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
