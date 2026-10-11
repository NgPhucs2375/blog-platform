'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { authApi } from '@/services/authApi';

function getApiError(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get('email') || '');
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await authApi.verifyEmailCode(email, code);
      setMessage('Email đã xác minh. Đang chuyển đến trang đăng nhập…');
      window.setTimeout(() => router.replace('/login'), 1000);
    } catch (e: unknown) {
      setError(getApiError(e, 'Mã không đúng hoặc đã hết hạn.'));
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError(''); setMessage('');
    try {
      await authApi.resendEmailCode(email);
      setMessage('Nếu email chưa xác minh, mã mới đã được gửi. Hãy kiểm tra cả mục Spam.');
    } catch (e: unknown) {
      setError(getApiError(e, 'Chưa gửi lại được mã.'));
    } finally { setBusy(false); }
  }

  return <div className="dark flex min-h-screen items-center justify-center bg-[#111111] px-4 py-12 text-[#f5f5f5]">
    <div className="w-full max-w-xl space-y-7 rounded-3xl bg-[#1a1a1a] px-6 py-8 sm:px-10">
      <header className="text-center"><h1 className="text-3xl font-bold text-white sm:text-4xl">Xác minh email</h1>
        <p className="mt-3 text-base leading-relaxed text-[#b7b7b7]">Nhập mã 6 chữ số đã gửi đến {email || 'email của bạn'}.</p></header>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm text-ink">{message}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="verification-code" className="block text-xs font-bold uppercase text-ink">Mã xác minh</label>
        <input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
          className="w-full rounded-2xl border border-[#48484a] bg-transparent px-4 py-5 text-center text-xl font-semibold tracking-[0.45em] text-white placeholder:text-[#a8a8a8] outline-none focus:border-[#777]" />
        <button disabled={busy || !email || code.length !== 6} className="w-full rounded-full bg-[#0095f6] py-4 text-base font-bold text-white transition hover:bg-[#1877f2] disabled:opacity-50">{busy ? 'Đang xử lý…' : 'Xác minh email'}</button>
      </form>
      <p className="text-center text-sm text-muted">Chưa nhận được mã? <button type="button" onClick={resend} disabled={busy || !email} className="font-semibold text-[#4ea8ff] hover:underline">Gửi lại mã</button></p>
      <div className="text-center"><Link href="/register" className="text-sm font-semibold text-[#4ea8ff] hover:underline">Quay lại đăng ký</Link></div>
    </div>
  </div>;
}
