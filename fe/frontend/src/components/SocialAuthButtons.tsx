'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { CircleNotch, Info } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import type { SocialProvider } from '@/services/authApi';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (target: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
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
  { id: 'github', label: 'Tiếp tục với GitHub', icon: <GitHubMark /> },
];

export default function SocialAuthButtons() {
  const { loginWithProvider } = useAuth();
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [scriptReady, setScriptReady] = useState(false);
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [notice, setNotice] = useState('');

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setPending('google');
    setNotice('');
    try {
      await loginWithProvider('google', credential);
      router.push('/');
    } catch (err: any) {
      setNotice(err?.response?.data?.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
    } finally {
      setPending(null);
    }
  }, [loginWithProvider, router]);

  useEffect(() => {
    const googleId = window.google?.accounts?.id;
    const target = googleButtonRef.current;
    if (!clientId || !scriptReady || !googleId || !target) return;

    target.replaceChildren();
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (!response.credential) {
          setNotice('Google không trả về thông tin đăng nhập. Vui lòng thử lại.');
          return;
        }
        void handleGoogleCredential(response.credential);
      },
    });
    googleId.renderButton(target, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      locale: 'vi',
      width: Math.min(400, Math.max(220, window.innerWidth - 48)),
    });
  }, [clientId, scriptReady, handleGoogleCredential]);

  const handleSocial = async (provider: SocialProvider) => {
    if (pending) return;
    setNotice('');
    setPending(provider);
    try {
      await loginWithProvider(provider);
      // Thành công: AuthContext đã lưu phiên, các trang tự nhận diện user.
    } catch (err: any) {
      setNotice(err?.response?.data?.message || 'Không kết nối được đến GitHub. Vui lòng thử lại.');
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
      {clientId && (
        <>
          <Script
            src="https://accounts.google.com/gsi/client?hl=vi"
            strategy="afterInteractive"
            onLoad={() => setScriptReady(true)}
          />
          <div className={pending === 'google' ? 'pointer-events-none opacity-60' : ''} ref={googleButtonRef} />
        </>
      )}
      {!clientId && (
        <p className="rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
          Đăng nhập Google chưa bật: cần cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID.
        </p>
      )}
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
