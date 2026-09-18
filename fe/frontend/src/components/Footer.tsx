import React from 'react';
import Link from 'next/link';

// Footer editorial: wordmark serif khổng lồ + cột liên kết + dòng colophon.
// Server component thuần, không state.

const exploreLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/posts', label: 'Khám phá bài viết' },
];

const communityLinks = [
  { href: '/register', label: 'Trở thành tác giả' },
  { href: '/login', label: 'Đăng nhập' },
  { href: '/dashboard', label: 'Bảng điều khiển' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Wordmark tạp chí */}
        <div className="border-b border-line py-12 sm:py-16">
          <p className="font-serif text-[clamp(2.75rem,8vw,6rem)] font-bold leading-none tracking-tight text-ink">
            Blog Platform<span className="text-accent">.</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Nền tảng xuất bản đa chiều, nơi những góc nhìn đa lĩnh vực được kể
            bằng thứ ngôn ngữ trung thực nhất.
          </p>
        </div>

        {/* Cột liên kết */}
        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-faint">
              Khám phá
            </h3>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((l) => (
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

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-faint">
              Cộng đồng
            </h3>
            <ul className="mt-4 space-y-2.5">
              {communityLinks.map((l) => (
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

          <div className="col-span-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-faint">
              Về ấn phẩm
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Mọi bài viết trước khi lên sóng đều đi qua vòng kiểm duyệt của
              ban biên tập. Góp ý cho ấn phẩm, bạn có thể để lại bình luận
              trực tiếp dưới bất kỳ bài viết nào.
            </p>
          </div>
        </div>

        {/* Colophon */}
        <div className="flex flex-col gap-2 border-t border-line py-6 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Blog Platform. Bảo lưu mọi quyền biên tập.</p>
          <p>Dựng bằng Next.js, Tailwind CSS và Motion.</p>
        </div>
      </div>
    </footer>
  );
}
