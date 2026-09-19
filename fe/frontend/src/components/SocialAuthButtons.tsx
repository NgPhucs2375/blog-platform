'use client';

import React, { useState } from 'react';
import { CircleNotch, Info } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import type { SocialProvider } from '@/services/authApi';

// Nút đăng nhập bằng nhà cung cấp ngoài, dùng chung cho login + register.
// BE chưa có endpoint OAuth thì hiển thị thông báo inline, không chặn form email.

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path
        fill="#24292f"
        d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.11-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
      />
    </svg>
  );
}

const PROVIDERS: Array<{
  id: SocialProvider;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'google', label: 'Tiếp tục với Google', icon: <GoogleMark /> },
  { id: 'github', label: 'Tiếp tục với GitHub', icon: <GitHubMark /> },
];

export default function SocialAuthButtons() {
  const { loginWithProvider } = useAuth();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [notice, setNotice] = useState('');

  const handleSocial = async (provider: SocialProvider) => {
    if (pending) return;
    setNotice('');
    setPending(provider);
    try {
      await loginWithProvider(provider);
      // Thành công: AuthContext đã lưu phiên, các trang tự nhận diện user.
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotice(
          'Đăng nhập bằng ' +
            (provider === 'google' ? 'Google' : 'GitHub') +
            ' chưa được kích hoạt trên máy chủ (backend cần hiện thực endpoint OAuth). Bạn vẫn có thể dùng email và mật khẩu.',
        );
      } else {
        setNotice(
          err?.response?.data?.message ||
            'Không kết nối được đến ' +
              (provider === 'google' ? 'Google' : 'GitHub') +
              '. Vui lòng thử lại.',
        );
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-medium text-faint">hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSocial(p.id)}
            disabled={pending !== null}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:border-accent/40 hover:shadow-md disabled:opacity-60"
          >
            {pending === p.id ? (
              <CircleNotch className="h-[18px] w-[18px] animate-spin text-muted" />
            ) : (
              p.icon
            )}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {notice && (
        <p className="flex items-start gap-2 rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>{notice}</span>
        </p>
      )}
    </div>
  );
}
