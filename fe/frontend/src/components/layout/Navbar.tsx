'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { CaretDown, Compass, Feather, List, PenNib, X } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { postApi, Category } from '@/services/postApi';
import { ADMIN_PREFIXES } from '@/config/navigation';
import NotificationsBell from '@/components/layout/NotificationsBell';
import UserMenu from '@/components/layout/UserMenu';
import ThemeToggle from '@/components/layout/ThemeToggle';

/** Link nội bộ trên navbar, có thể trỏ tới anchor của trang chủ. */
interface NavEntry {
  key: string;
  label: string;
  href: string;
  /** id section trên trang chủ dùng cho scroll-spy */
  spyId?: string;
  icon: React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' }>;
}

const NAV_ENTRIES: NavEntry[] = [
  { key: 'home', label: 'Trang chủ', href: '/', spyId: 'top', icon: PenNib },
  { key: 'feed', label: 'Tin mới', href: '/#home-feed', spyId: 'home-feed', icon: Feather },
  { key: 'events', label: 'Sự kiện', href: '/#home-events', spyId: 'home-events', icon: Compass },
];

/**
 * Header khu vực công khai + dashboard (admin dùng AdminShell riêng,
 * header tự ẩn khi pathname nằm trong ADMIN_PREFIXES).
 * Có scroll-spy: khi lướt qua các section của trang chủ, pill active
 * trượt theo section đang xem.
 */
export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthStatus();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spySection, setSpySection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    postApi
      .getCategories()
      .then((cats) => setCategories(cats || []))
      .catch(() => setCategories([]));
  }, []);

  // Đóng mọi dropdown khi đổi trang
  useEffect(() => {
    setCatOpen(false);
    setMobileOpen(false);
    setSpySection(null);
  }, [pathname]);

  // Scroll-spy: dùng useScroll của Motion (rAF-batched, không phải scroll
  // listener thô). Mỗi lần vị trí cuộn đổi, xác định section đang chiếm
  // vùng giữa màn hình. Sections render sau khi data load nên tra cứu DOM
  // trực tiếp tại từng frame (rẻ: chỉ 2 lượt getBoundingClientRect).
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', () => {
    if (pathname !== '/') return;
    const mid = window.innerHeight * 0.4;
    let next = 'top';
    for (const id of ['home-feed', 'home-events']) {
      const el = document.getElementById(id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top <= mid && rect.bottom >= mid) {
        next = id;
        break;
      }
    }
    setSpySection((prev) => (prev === next ? prev : next));
  });

  if (!pathname || ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const isActive = (entry: NavEntry) => {
    if (entry.spyId && entry.spyId !== 'top') {
      return pathname === '/' && spySection === entry.spyId;
    }
    if (entry.spyId === 'top') {
      return pathname === '/' && (spySection === 'top' || spySection === null);
    }
    return entry.href === '/'
      ? pathname === '/'
      : pathname.startsWith(entry.href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo — wordmark thuần theo GODRULE Clean */}
        <Link href="/" className="flex shrink-0 items-center">
          <span className="text-lg font-extrabold tracking-tight text-ink">
            Blog Platform<span className="text-accent">.</span>
          </span>
        </Link>

        {/* Menu desktop với pill trượt theo scroll-spy */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ENTRIES.map((entry) => {
            const active = isActive(entry);
            const Icon = entry.icon;
            return (
              <Link
                key={entry.key}
                href={entry.href}
                className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active ? 'text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-spy-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-accent-soft"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" weight={active ? 'fill' : 'regular'} />
                  {entry.label}
                </span>
              </Link>
            );
          })}

          {/* Dropdown chuyên mục */}
          <div className="relative">
            <button
              onClick={() => setCatOpen((v) => !v)}
              aria-expanded={catOpen}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                catOpen
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-raised hover:text-ink'
              }`}
            >
              Danh mục
              <CaretDown
                className={`h-3 w-3 transition-transform ${catOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {catOpen && (
                <>
                  <div
                    aria-hidden
                    className="fixed inset-0 z-40"
                    onClick={() => setCatOpen(false)}
                  />
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/10"
                  >
                    {categories.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-faint">
                        Chưa có chuyên mục nào.
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href="/posts"
                          onClick={() => setCatOpen(false)}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-raised"
                        >
                          <span className="text-xs font-semibold text-ink">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-faint">Xem bài</span>
                        </Link>
                      ))
                    )}
                    <Link
                      href="/posts"
                      onClick={() => setCatOpen(false)}
                      className="mt-1 flex items-center justify-center gap-1 rounded-xl border border-dashed border-line px-3 py-2.5 text-[11px] font-semibold text-accent transition hover:bg-accent-soft"
                    >
                      Xem tất cả bài viết
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {mounted && user && (
            <Link
              href="/dashboard"
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                pathname.startsWith('/dashboard')
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-raised hover:text-ink'
              }`}
            >
              Bảng điều khiển
            </Link>
          )}
        </nav>

        {/* Khu hành động */}
        <div className="flex shrink-0 items-center gap-2.5">
          {mounted && user && <NotificationsBell />}
          <ThemeToggle />

          {mounted && !user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-accent/40"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#134e4a] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#0f766e]/25 transition hover:opacity-90"
              >
                Bắt đầu
              </Link>
            </div>
          ) : mounted && user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-accent/40"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0f766e] to-[#134e4a] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#0f766e]/25 transition hover:opacity-90"
              >
                Bắt đầu
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted shadow-sm transition hover:text-ink md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Panel mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-surface md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_ENTRIES.map((entry) => {
                const Icon = entry.icon;
                const active = isActive(entry);
                return (
                  <Link
                    key={entry.key}
                    href={entry.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                      active ? 'bg-accent-soft text-accent' : 'text-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {entry.label}
                  </Link>
                );
              })}
              {mounted && user && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted"
                >
                  Bảng điều khiển
                </Link>
              )}
              {mounted && !user && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/login"
                    className="rounded-xl border border-line px-3 py-2.5 text-center text-xs font-semibold text-ink"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-gradient-to-r from-[#0f766e] to-[#134e4a] px-3 py-2.5 text-center text-xs font-bold text-white"
                  >
                    Bắt đầu
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Bọc useAuth để Navbar dùng được cả khi chưa đăng nhập. */
function useAuthStatus() {
  const ctx = useAuth() as any;
  return {
    user: ctx?.user ?? null,
    isAdmin: Boolean(ctx?.user && ctx?.user?.role === 'Admin'),
  };
}
