'use client';

import React, { useEffect, useState } from 'react';
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
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPasswordChanged(params.get('passwordChanged') === '1' || params.get('passwordReset') === 'success');
  }, []);

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
    <div className="dark flex min-h-screen items-center justify-center bg-[#111111] px-4 py-12 text-[#f5f5f5]">
      <div className="w-full max-w-md space-y-7 rounded-3xl bg-[#1a1a1a] px-6 py-8 sm:px-10">
        
        {/* Header Form */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0095f6]/25 bg-[#0095f6]/10 text-[#4ea8ff] shadow-sm">
            <Key className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Chào mừng trở lại
          </h1>
          <p className="text-base leading-relaxed text-[#b7b7b7]">
            Đăng nhập để tiếp tục khám phá và xuất bản bài viết
          </p>
        </div>

        {/* Thông báo lỗi */}
        {passwordChanged && (
          <p role="status" className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 animate-in fade-in duration-200">
            <WarningCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-base font-semibold text-white">
              Địa chỉ Email
            </label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-[#48484a] bg-transparent px-4 py-4 text-base text-white placeholder:text-[#a8a8a8] outline-none transition focus:border-[#777] focus:bg-[#1c1c1e]"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-white">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[#48484a] bg-transparent py-4 pl-4 pr-12 text-base text-white placeholder:text-[#a8a8a8] outline-none transition focus:border-[#777] focus:bg-[#1c1c1e]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] transition hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="-mt-1 text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-[#4ea8ff] hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0095f6] py-4 text-base font-bold text-white transition hover:bg-[#1877f2] disabled:opacity-50"
          >
            {loading ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            <span>Đăng nhập</span>
          </button>
        </form>

        {/* Đăng nhập bằng nhà cung cấp ngoài */}
        <SocialAuthButtons />

        {/* Chân trang chuyển hướng */}
        <div className="text-center text-sm text-[#a8a8a8] pt-5 border-t border-white/10">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#4ea8ff] hover:underline inline-flex items-center gap-0.5"
          >
            Đăng ký ngay <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>

      </div>
    </div>
  );
}
