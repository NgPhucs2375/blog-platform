'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import Chatbot from '@/components/Chatbot';

// Chrome dành cho khu vực công khai (trang đọc + auth).
// Dashboard và các trang admin không dính Footer/Chatbot.

const EXCLUDED_PREFIXES = [
  '/dashboard',
  '/users',
  '/categories',
  '/reports',
  '/moderation-rules',
];

export default function SiteChrome() {
  const pathname = usePathname();
  if (!pathname) return null;
  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  if (excluded) return null;

  return (
    <>
      <Footer />
      <Chatbot />
    </>
  );
}
