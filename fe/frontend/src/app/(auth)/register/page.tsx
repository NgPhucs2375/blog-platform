'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Feather, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !email.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 8 ký tự.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await register({
        userName: userName.trim(),
        email: email.trim(),
        password,
      });
      router.push('/login');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng ký không thành công. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-xl dark:border-white/[0.08] dark:bg-[#0c121e]/80 dark:shadow-2xl backdrop-blur-xl transition-colors">
        
        {/* Header Form */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm">
            <Feather className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Tạo tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Bắt đầu hành trình xuất bản và kết nối trên Blog Platform.
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng ký */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tên người dùng
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="NguyenVanA"
              required
              minLength={3}
              maxLength={50}
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
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
                placeholder="Ít nhất 8 ký tự"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-10 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-10 py-2.5 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>Đăng ký</span>
          </button>
        </form>

        {/* Chân trang chuyển hướng */}
        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
          >
            Đăng nhập <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>

      </div>
    </div>
  );
}