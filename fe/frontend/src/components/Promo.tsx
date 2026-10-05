'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Tag } from '@phosphor-icons/react';
import type { EventTicketData, PromoBannerData } from '@/config/promotions';

// Banner quảng cáo + vé sự kiện, dữ liệu lấy từ src/config/promotions.ts.
// Muốn đổi ảnh/chữ chỉ cần sửa file config, không đụng component này.

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function PromoBanner({ data }: { data: PromoBannerData }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
      className="group relative overflow-hidden rounded-3xl border border-line"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.image}
        alt={data.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      {/* Scrim giữ màu thương hiệu, không dùng đen tuyền */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#042f2e]/90 via-[#115e59]/70 to-transparent" />

      <div className="relative flex flex-col gap-6 p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {data.eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              {data.eyebrow}
            </p>
          )}
          <h3 className="mt-2 font-serif text-2xl font-bold leading-snug text-white sm:text-3xl">
            {data.title}
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
            {data.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          {data.tag && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Tag className="h-3 w-3" /> {data.tag}
            </span>
          )}
          <Link
            href={data.cta.href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#115e59] shadow-lg transition hover:gap-3"
          >
            {data.cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

const TICKET_STATUS = {
  open: {
    label: 'Đang mở đăng ký',
    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  'almost-full': {
    label: 'Sắp hết chỗ',
    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  closed: {
    label: 'Đã đóng đăng ký',
    cls: 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-zinc-300',
  },
} as const;

function Ticket({ data, flip }: { data: EventTicketData; flip?: boolean }) {
  const reduce = useReducedMotion();
  const status = TICKET_STATUS[data.status];

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduce ? 0 : 0.65, ease: EASE_OUT }}
      whileHover={reduce ? undefined : { y: -4 }}
      className="group relative flex overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_8px_36px_-16px_rgba(166,13,32,0.28)]"
    >
      {/* Ảnh + khối ngày (mặt trái vé) */}
      <div className="relative w-32 shrink-0 overflow-hidden sm:w-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image}
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.06] ${
            flip ? '' : ''
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#042f2e]/80 via-[#115e59]/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white">
          <p className="font-serif text-3xl font-extrabold leading-none sm:text-4xl">
            {data.day}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
            {data.month}
          </p>
        </div>
      </div>

      {/* Nội dung vé (mặt phải) */}
      <div className="relative flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${status.cls}`}
        >
          {status.label}
        </span>
        <h4 className="mt-2.5 line-clamp-2 font-serif text-sm font-bold leading-snug text-ink sm:text-base">
          {data.title}
        </h4>
        <p className="mt-2 space-y-1 text-[11px] text-muted">
          <span className="block truncate">{data.location}</span>
          <span className="block">{data.time}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-line pt-3">
          <p className="text-[11px] font-semibold text-accent">
            Còn {data.seatsLeft} ghế
          </p>
          <Link
            href={data.cta.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0f766e] to-[#134e4a] px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-[#0f766e]/30 transition hover:gap-2.5"
          >
            {data.cta.label} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Lỗ đục lỗ kiểu vé giấy */}
      <span
        aria-hidden
        className="absolute -left-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-canvas ring-1 ring-line sm:block"
      />
      <span
        aria-hidden
        className="absolute -right-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-canvas ring-1 ring-line sm:block"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-32 top-auto hidden w-px sm:block"
      />
    </motion.article>
  );
}

export function EventTicketList({ tickets }: { tickets: EventTicketData[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {tickets.map((t, i) => (
        <Ticket key={`${t.title}-${i}`} data={t} flip={i % 2 === 1} />
      ))}
    </div>
  );
}
