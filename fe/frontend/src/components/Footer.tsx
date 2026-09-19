'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Check, PaperPlaneTilt } from '@phosphor-icons/react';
import { postApi, Category } from '@/services/postApi';
import { FOOTER_COLUMNS } from '@/config/navigation';

// Footer editorial: brand + newsletter + cột liên kết (chuyên mục lấy động
// từ API) + thanh dưới với nút về đầu trang.
// Brand icons vẽ inline vì lucide-react mới đã loại bỏ icon thương hiệu.

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.3v3h2.4v7h2.8Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M17.2 4h2.6l-5.7 6.5L20.8 20h-5.3l-4.1-5.4L6.6 20H4l6.1-7L3.6 4H9l3.7 4.9L17.2 4Zm-.9 14.3h1.4L8.2 5.6H6.7l9.6 12.7Z" />
    </svg>
  );
}

function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.11-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Facebook', Icon: FacebookMark, href: 'https://facebook.com' },
  { label: 'Twitter / X', Icon: XMark, href: 'https://x.com' },
  { label: 'YouTube', Icon: YoutubeMark, href: 'https://youtube.com' },
  { label: 'GitHub', Icon: GithubMark, href: 'https://github.com' },
];

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    postApi
      .getCategories()
      .then((cats) => setCategories((cats || []).slice(0, 5)))
      .catch(() => setCategories([]));
  }, []);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    // UI-only: backend chưa có endpoint nhận bản tin.
    setSubscribed(true);
  };

  const backToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="border-t border-line bg-raised/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Khối chính */}
        <div className="grid gap-12 py-14 lg:grid-cols-[1.15fr_1.85fr]">
          {/* Brand + newsletter */}
          <div>
            <p className="font-serif text-3xl font-bold tracking-tight text-ink">
              Blog Platform<span className="text-accent">.</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Tạp chí điện tử và diễn đàn mở: nơi những góc nhìn đa lĩnh vực
              được biên tập kỹ lưỡng trước khi đến với người đọc.
            </p>

            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-faint">
                Nhận bản tin tuần
              </p>
              {subscribed ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-accent">
                  <Check className="h-4 w-4" />
                  Đã ghi danh — hẹn gặp bạn trong số tuần này!
                </p>
              ) : (
                <form onSubmit={subscribe} className="mt-3 flex max-w-sm gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@cua-ban.vn"
                    aria-label="Email nhận bản tin"
                    className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-xs text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="submit"
                    aria-label="Đăng ký bản tin"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#0f766e] to-[#134e4a] text-white shadow-md shadow-[#0f766e]/25 transition hover:opacity-90"
                  >
                    <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Cột liên kết */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-faint">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted transition hover:text-accent"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-faint">
                Chuyên mục
              </p>
              <ul className="mt-4 space-y-2.5">
                {categories.length === 0 ? (
                  <li className="text-sm text-faint">Đang cập nhật...</li>
                ) : (
                  categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href="/posts"
                        className="text-sm text-muted transition hover:text-accent"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Thanh dưới */}
        <div className="flex flex-col gap-3 border-t border-line py-6 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Blog Platform. Bảo lưu mọi quyền biên tập.
          </p>
          <p>Dựng bằng Next.js, Tailwind CSS và Motion.</p>
          <button
            onClick={backToTop}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 font-semibold text-muted transition hover:text-accent"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Về đầu trang
          </button>
        </div>
      </div>
    </footer>
  );
}
