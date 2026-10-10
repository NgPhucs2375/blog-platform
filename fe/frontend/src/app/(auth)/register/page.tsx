'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeSlash, Feather, WarningCircle, CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import SocialAuthButtons from '@/components/SocialAuthButtons';

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
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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
    <div className="dark flex min-h-screen items-center justify-center bg-[#111111] px-4 py-12 text-[#f5f5f5]">
      <div className="w-full max-w-md space-y-7 rounded-3xl bg-[#1a1a1a] px-6 py-8 sm:px-10">
        
        {/* Header Form */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0095f6]/25 bg-[#0095f6]/10 text-[#4ea8ff] shadow-sm">
            <Feather className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tạo tài khoản
          </h1>
          <p className="text-base leading-relaxed text-[#b7b7b7]">
            Bắt đầu hành trình xuất bản và kết nối trên Blog Platform.
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 animate-in fade-in duration-200">
            <WarningCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Đăng ký */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-base font-semibold text-white">
              Tên người dùng
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Nhập tên người dùng"
              required
              minLength={3}
              maxLength={50}
              autoComplete="username"
              className="w-full rounded-2xl border border-[#48484a] bg-transparent px-4 py-4 text-base text-white placeholder:text-[#a8a8a8] outline-none transition focus:border-[#777] focus:bg-[#1c1c1e]"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-white">
              Địa chỉ Email
            </label>
            <input
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                required
                minLength={8}
                autoComplete="new-password"
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

          <div>
            <label className="mb-2 block text-base font-semibold text-white">
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
                className="w-full rounded-2xl border border-[#48484a] bg-transparent py-4 pl-4 pr-12 text-base text-white placeholder:text-[#a8a8a8] outline-none transition focus:border-[#777] focus:bg-[#1c1c1e]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] transition hover:text-white"
                tabIndex={-1}
              >
                {showConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0095f6] py-4 text-base font-bold text-white transition hover:bg-[#1877f2] disabled:opacity-50"
          >
            {loading ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            <span>Đăng ký</span>
          </button>
        </form>

        {/* Đăng nhập bằng nhà cung cấp ngoài */}
        <SocialAuthButtons />

        {/* Chân trang chuyển hướng */}
        <div className="text-center text-sm text-[#a8a8a8] pt-5 border-t border-white/10">
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#4ea8ff] hover:underline inline-flex items-center gap-0.5"
          >
            Đăng nhập <ArrowRight className="h-3 w-3 inline" />
          </Link>
        </div>

      </div>
    </div>
  );
}
