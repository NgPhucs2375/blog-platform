'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  KeyRound,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

export default function ProfilePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Form states - Thông tin tài khoản
  const [bio, setBio] = useState('');
  const [updatingBio, setUpdatingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states - Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedBio = localStorage.getItem(`user_bio_${user?.id || user?.userName}`);
    if (savedBio) setBio(savedBio);
  }, [user]);

  // Cập nhật tiểu sử
  const handleUpdateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBio(true);
    setBioMessage(null);

    try {
      localStorage.setItem(`user_bio_${user?.id || user?.userName}`, bio.trim());
      try {
        await api.put('/v1/profile', { bio: bio.trim() });
      } catch {
        // Dự phòng cục bộ
      }
      setBioMessage({ type: 'success', text: 'Cập nhật tiểu sử thành công!' });
      setTimeout(() => setBioMessage(null), 3000);
    } catch (err: any) {
      setBioMessage({ type: 'error', text: err?.response?.data?.message || 'Không thể lưu tiểu sử.' });
    } finally {
      setUpdatingBio(false);
    }
  };

  // Đổi mật khẩu kết nối trực tiếp vào PUT /v1/profile/password của Backend
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ các trường mật khẩu.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải chứa ít nhất 8 ký tự.' });
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      // Gọi đúng endpoint PUT /api/v1/profile/password đã định nghĩa trong ProfileController
      const res = await api.put('/v1/profile/password', {
        currentPassword,
        newPassword,
      });

      setPasswordMessage({
        type: 'success',
        text: res.data?.message || 'Đổi mật khẩu thành công!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: any) {
      const errData = err?.response?.data;
      const validationDetail =
        errData?.errors?.newPassword ||
        errData?.data?.newPassword ||
        errData?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!';
      
      setPasswordMessage({
        type: 'error',
        text: typeof validationDetail === 'string' ? validationDetail : JSON.stringify(validationDetail),
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-[#06080e] text-zinc-500 dark:text-zinc-400 transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-red-700 dark:text-red-400" />
        <p className="text-xs font-medium tracking-wide">Đang đồng bộ hồ sơ...</p>
      </div>
    );
  }

  const username = user?.userName || (user as any)?.username || 'Tác giả';
  const email = user?.email || 'email@example.com';
  const role = user?.role || 'User';
  const userId = user?.id ?? '#';
  const initialLetter = username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 pb-20">
      
      <div className="absolute inset-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Banner hồ sơ */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 flex flex-col sm:flex-row items-center gap-6">
          <div
            suppressHydrationWarning
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-700 via-red-600 to-purple-600 text-3xl font-black text-white shadow-lg shadow-red-600/25"
          >
            {initialLetter}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h1
              suppressHydrationWarning
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white"
            >
              {username}
            </h1>
            <p
              suppressHydrationWarning
              className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{email}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span
                suppressHydrationWarning
                className="inline-flex items-center gap-1 rounded-full border border-red-600/20 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:border-red-600/30 dark:bg-red-600/10 dark:text-red-300"
              >
                <Shield className="h-3 w-3" /> Vai trò: {role}
              </span>
              <span
                suppressHydrationWarning
                className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-mono text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400"
              >
                ID: #{userId}
              </span>
            </div>
          </div>
        </div>

        {/* Cấu hình tài khoản & Đổi mật khẩu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Cột Trái: Thông tin tài khoản */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-5">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4 text-red-700 dark:text-red-400" />
                Thông tin tài khoản
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Chi tiết nhận diện hiển thị trên các ấn phẩm bài viết của bạn.
              </p>
            </div>

            {bioMessage && (
              <div
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-medium ${
                  bioMessage.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'
                }`}
              >
                {bioMessage.type === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                <span>{bioMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBio} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Tên tài khoản
                </label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Tiểu sử (Bio)
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu bản thân, lĩnh vực chuyên môn hoặc sở thích..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingBio}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-700/25 hover:bg-red-600 active:scale-95 disabled:opacity-50 transition"
                >
                  {updatingBio && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Lưu tiểu sử
                </button>
              </div>
            </form>
          </div>

          {/* Cột Phải: Đổi mật khẩu */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-5">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-red-700 dark:text-red-400" />
                Đổi mật khẩu
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tối thiểu 8 ký tự (gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt).
              </p>
            </div>

            {passwordMessage && (
              <div
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-medium ${
                  passwordMessage.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự, đủ 4 nhóm"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition"
                >
                  {updatingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}