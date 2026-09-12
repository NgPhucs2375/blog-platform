'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Feather,
    Sparkles,
    Compass,
    LayoutDashboard,
    Shield,
    Sun,
    Moon,
    PenSquare,
    User as UserIcon,
    LogOut,
    LogIn,
    Menu,
    X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { theme, toggleTheme, setTheme } = useTheme() as any;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Đảm bảo chỉ render các phần tử phụ thuộc Client sau khi hoàn tất Hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    const isAuth = mounted && Boolean(user);
    const isAdmin = isAuth && user?.role === 'Admin';
    const username = user?.userName || (user as any)?.username || 'Tác giả';

    const handleThemeToggle = () => {
        if (typeof toggleTheme === 'function') {
            toggleTheme();
        } else if (typeof setTheme === 'function') {
            setTheme(theme === 'dark' ? 'light' : 'dark');
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 dark:border-white/[0.08] dark:bg-[#06080e]/80 backdrop-blur-md transition-colors duration-200">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* 1. Logo & Main Menu Links */}
                <div className="flex items-center gap-8">
                    {/* Logo Thương hiệu */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 group-hover:scale-105 transition shadow-sm">
                            <Feather className="h-4 w-4" />
                        </div>
                        <span className="text-base font-extrabold tracking-tight text-zinc-950 dark:text-white">
                            Blog Platform<span className="text-indigo-600 dark:text-indigo-400">.</span>
                        </span>
                    </Link>

                    {/* Menu máy tính */}
                    <nav className="hidden md:flex items-center gap-1.5">
                        <Link
                            href="/"
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${pathname === '/'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-600/15 dark:text-indigo-300 dark:border-indigo-500/30'
                                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.05]'
                                }`}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Trang chủ
                        </Link>

                        <Link
                            href="/posts"
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${pathname.startsWith('/posts')
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-600/15 dark:text-indigo-300 dark:border-indigo-500/30'
                                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.05]'
                                }`}
                        >
                            <Compass className="h-3.5 w-3.5" />
                            Khám phá bài viết
                        </Link>

                        {/* Chỉ render liên kết Dashboard khi đã mount thành công */}
                        {isAuth && (
                            <Link
                                href="/dashboard"
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${pathname.startsWith('/dashboard')
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-600/15 dark:text-indigo-300 dark:border-indigo-500/30'
                                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.05]'
                                    }`}
                            >
                                <LayoutDashboard className="h-3.5 w-3.5" />
                                Bảng điều khiển
                            </Link>
                        )}

                        {/* Chỉ render liên kết Quản trị khi đã mount và là Admin */}
                        {isAdmin && (
                            <Link
                                href="/users"
                                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${pathname.startsWith('/users') || pathname.startsWith('/categories') || pathname.startsWith('/reports')
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-600/15 dark:text-indigo-300 dark:border-indigo-500/30'
                                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.05]'
                                    }`}
                            >
                                <Shield className="h-3.5 w-3.5" />
                                Quản trị hệ thống
                            </Link>
                        )}
                    </nav>
                </div>

                {/* 2. Actions & User Controls */}
                <div className="flex items-center gap-2.5 sm:gap-3">

                    {/* Nút chuyển giao diện Sáng / Tối */}
                    <button
                        onClick={handleThemeToggle}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-white transition"
                        title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                        aria-label="Đổi giao diện"
                    >
                        {mounted && theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>

                    {/* Vùng xác thực: Tránh chớp nháy và đồng bộ SSR */}
                    {!mounted ? (
                        <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-white/5 animate-pulse" />
                    ) : isAuth ? (
                        <>
                            {/* Nút Viết bài */}
                            <Link
                                href="/dashboard"
                                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition"
                            >
                                <PenSquare className="h-3.5 w-3.5" />
                                <span>Viết bài</span>
                            </Link>

                            {/* Thẻ Profile chuyển hướng sang /profile */}
                            <Link
                                href="/profile"
                                className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs transition shadow-sm group ${pathname === '/profile'
                                        ? 'border-indigo-500/50 bg-indigo-50/80 dark:bg-indigo-500/15'
                                        : 'border-zinc-200 bg-white hover:border-indigo-500/40 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:border-white/20'
                                    }`}
                                title="Hồ sơ cá nhân"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300 font-bold text-xs">
                                    <UserIcon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex flex-col text-left leading-none">
                                    <span suppressHydrationWarning className="font-bold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                        {username}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                                        {user?.role || 'User'}
                                    </span>
                                </div>
                            </Link>

                            {/* Nút Đăng xuất */}
                            <button
                                onClick={logout}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition"
                                title="Đăng xuất"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition"
                            >
                                <LogIn className="h-3.5 w-3.5" />
                                <span>Đăng nhập</span>
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition"
                            >
                                <span>Bắt đầu</span>
                            </Link>
                        </div>
                    )}

                    {/* Menu Mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 transition"
                        aria-label="Toggle Menu"
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>

            </div>

            {/* 3. Dropdown Menu thiết bị di động */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-zinc-200/80 bg-white dark:border-white/[0.08] dark:bg-[#080c14] px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${pathname === '/'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                    >
                        <Sparkles className="h-4 w-4" />
                        Trang chủ
                    </Link>

                    <Link
                        href="/posts"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${pathname.startsWith('/posts')
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300'
                                : 'text-zinc-600 dark:text-zinc-400'
                            }`}
                    >
                        <Compass className="h-4 w-4" />
                        Khám phá bài viết
                    </Link>

                    {isAuth && (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${pathname.startsWith('/dashboard')
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Bảng điều khiển
                        </Link>
                    )}

                    {isAdmin && (
                        <Link
                            href="/users"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold ${pathname.startsWith('/users') || pathname.startsWith('/categories') || pathname.startsWith('/reports')
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-600/15 dark:text-indigo-300'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                        >
                            <Shield className="h-4 w-4" />
                            Quản trị hệ thống
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}