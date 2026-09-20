'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeSlash, Key, WarningCircle, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email/tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await login({ email: email.trim(), password });
      router.push('/');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin!';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header Form */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-200/60 text-accent dark:bg-accent/15 dark:border-accent/30 dark:text-rose-600 shadow-sm">
            <Key className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Chào mừng trở lại
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Đăng nhập để tiếp tục khám phá và xuất bản bài viết
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 animate-in fade-in duration-200">
            <WarningCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email hoặc tên đăng nhập
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usertest hoặc you@example.com"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:focus:bg-white/[0.06] dark:text-white dark:placeholder-zinc-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-10 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:focus:bg-white/[0.06] dark:text-white dark:placeholder-zinc-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-[0.99] disabled:opacity-50 transition"
          >
            {loading ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            <span>Đăng nhập</span>
          </button>
        </form>

        {/* Đăng nhập bằng nhà cung cấp ngoài */}
        <SocialAuthButtons />

        {/* Chân trang chuyển hướng */}
        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-accent dark:text-rose-600 hover:underline inline-flex items-center gap-0.5"
          >
            Đăng ký ngay <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>

      </div>
    </div>
  );
}
