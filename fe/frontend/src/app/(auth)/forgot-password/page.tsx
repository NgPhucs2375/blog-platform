'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CircleNotch, EnvelopeSimple, WarningCircle } from '@phosphor-icons/react';
import { authApi } from '@/services/authApi';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.requestPasswordReset(email.trim());
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Chưa gửi được mã xác minh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-7">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200/60 bg-red-50 text-accent shadow-sm dark:border-accent/30 dark:bg-accent/15 dark:text-rose-600">
            <EnvelopeSimple className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Quên mật khẩu?
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            Nhập email tài khoản, chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
            <WarningCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Địa chỉ email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email của bạn"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06]"
            />
          </div>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover disabled:opacity-50">
            {loading && <CircleNotch className="h-4 w-4 animate-spin" />}
            Gửi mã xác minh
          </button>
        </form>

        <div className="border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
