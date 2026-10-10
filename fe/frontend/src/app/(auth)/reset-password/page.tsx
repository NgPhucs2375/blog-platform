'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CircleNotch, Eye, EyeSlash, Key, WarningCircle } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCodeSent(params.has('email'));
    setEmail(params.get('email') || '');
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || code.length !== 6) {
      setError('Vui lòng nhập email và mã xác minh gồm 6 chữ số.');
      return;
    }
    if (password !== confirmation) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({
        email,
        code,
        password,
        password_confirmation: confirmation,
      });
      router.push('/login?passwordChanged=1');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã không đúng hoặc đã hết hạn. Hãy gửi mã mới.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authApi.requestPasswordReset(email.trim());
      setCode('');
      setCodeSent(true);
      setMessage('Nếu email thuộc tài khoản đã đăng ký, mã xác minh mới đã được gửi. Hãy kiểm tra cả thư mục Spam.');
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
            <Key className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            Tạo mật khẩu mới
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            {email ? `Nhập mã đã gửi đến ${email}` : 'Nhập email và mã xác minh để đặt lại mật khẩu.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
            <WarningCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm text-ink">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Địa chỉ email</label>
            <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Nhập email của bạn" required autoComplete="email" className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06]" />
          </div>
          <div>
            <label htmlFor="reset-code" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Mã xác minh</label>
            <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nhập mã 6 chữ số" required className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-center text-lg tracking-[0.4em] text-zinc-950 placeholder-zinc-400 transition focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06]" />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Mật khẩu mới</label>
            <div className="relative">
              <input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pr-11 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06]" />
              <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Xác nhận mật khẩu</label>
            <div className="relative">
              <input id="confirm-password" type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu mới" required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pr-11 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/[0.06]" />
              <button type="button" aria-label={showConfirmation ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'} onClick={() => setShowConfirmation((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                {showConfirmation ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading || !codeSent || code.length !== 6} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent-hover disabled:opacity-50">
            {loading && <CircleNotch className="h-4 w-4 animate-spin" />}
            Đặt lại mật khẩu
          </button>
        </form>

        <div className="border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500 dark:border-white/[0.06] dark:text-zinc-400">
          <button type="button" onClick={resendCode} disabled={loading || !email.trim()} className="inline-flex items-center gap-1 font-semibold text-accent hover:underline disabled:opacity-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Gửi lại mã xác minh
          </button>
        </div>
      </div>
    </div>
  );
}
