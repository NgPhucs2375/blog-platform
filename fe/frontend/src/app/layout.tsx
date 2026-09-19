import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SiteChrome from "@/components/SiteChrome";
import { Providers } from "./providers";

// Be Vietnam Pro: sans được thiết kế riêng cho dấu tiếng Việt, render sạch ở mọi cỡ.
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-bevietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Playfair Display: serif display tương phản cao cho tiêu đề tạp chí, hỗ trợ vietnamese subset.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["vietnamese", "latin"],
  style: ["normal", "italic"],
});

// Geist Mono cho các nhãn số liệu, mã, ngày in phong cách kỹ thuật
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog Platform — Nền tảng xuất bản đa chiều",
  description: "Không gian tự do chia sẻ câu chuyện, kiến thức và góc nhìn đa lĩnh vực",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink transition-colors duration-200">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <SiteChrome />
        </Providers>
      </body>
    </html>
  );
}