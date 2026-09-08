'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { profileApi } from '@/services/profileApi';

export default function ProfilePage() {
  const { user } = useAuth();

  // State cập nhật hồ sơ
  const [bio, setBio] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setBio((user as any).bio || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg(null);

    try {
      await profileApi.updateProfile({ bio });
      setProfileMsg({ type: 'success', text: 'Cập nhật tiểu sử thành công!' });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cập nhật thông tin.',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Mật khẩu mới không trùng khớp!' });
      return;
    }

    setChangingPass(true);
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword,
      });
      setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({
        type: 'error',
        text: err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.',
      });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Hồ sơ cá nhân</h1>
              <p className="text-sm text-slate-400 mt-1">Quản lý tài khoản và bảo mật mật khẩu</p>
            </div>
            <Link
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-indigo-400 border border-slate-800 rounded-lg px-3 py-2 transition"
            >
              ← Về trang chủ
            </Link>
          </div>

          {/* User Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg shadow-indigo-500/20">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold text-white">{user?.username || (user as any)?.userName}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="rounded-full bg-indigo-950/80 px-3 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-800/50">
                  Vai trò: {user?.role || 'author'}
                </span>
                <span className="rounded-full bg-slate-800/80 px-3 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">
                  ID: #{user?.id}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Form Cập nhật thông tin */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Thông tin tài khoản</h3>

                {profileMsg && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-xs border ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} id="profile-form" className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tên tài khoản
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full rounded-xl border border-slate-800/50 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full rounded-xl border border-slate-800/50 bg-slate-900/60 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Tiểu sử (Bio)
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Giới thiệu bản thân..."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition resize-none"
                    />
                  </div>
                </form>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex justify-end">
                <button
                  type="submit"
                  form="profile-form"
                  disabled={updatingProfile}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {updatingProfile ? 'Đang lưu...' : 'Lưu tiểu sử'}
                </button>
              </div>
            </div>

            {/* Form Đổi mật khẩu */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Đổi mật khẩu</h3>

                {passMsg && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-xs border ${
                      passMsg.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {passMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} id="password-form" className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                </form>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex justify-end">
                <button
                  type="submit"
                  form="password-form"
                  disabled={changingPass}
                  className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
                >
                  {changingPass ? 'Đang đổi...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}