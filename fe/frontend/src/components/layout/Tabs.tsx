'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

export interface TabItem {
  /** Định danh tab (hoặc đường dẫn nếu dùng chế độ link) */
  id: string;
  label: string;
  /** Nếu có href, tab render thành Link và active theo activeId */
  href?: string;
  /** Icon tùy chọn hiển thị trước label */
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  items: TabItem[];
  /** id của tab đang active (khớp tuyệt đối với item.id hoặc pathname bắt đầu bằng id) */
  activeId: string;
  /** Callback khi bấm tab không có href */
  onChange?: (id: string) => void;
  /** layoutId riêng cho từng instance để hiệu ứng pill không đè nhau */
  layoutId?: string;
  className?: string;
}

/**
 * Tabs dạng pill có hiệu ứng trượt (motion layoutId).
 * Hỗ trợ cả chế độ link (item.href) lẫn chế độ callback (onChange).
 */
export default function Tabs({
  items,
  activeId,
  onChange,
  layoutId = 'tabs-pill',
  className = '',
}: TabsProps) {

  const isActive = (item: TabItem) =>
    item.href ? activeId === item.id || activeId.startsWith(item.id) : activeId === item.id;

  return (
    <div className={`scroll-slim flex items-center gap-1 overflow-x-auto ${className}`}>
      {items.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        const inner = (
          <>
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            <span
              className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap ${
                active ? 'text-canvas' : ''
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {item.label}
            </span>
          </>
        );
        const cls = `relative rounded-full px-4 py-1.5 text-xs font-semibold transition ${
          active ? '' : 'text-muted hover:text-ink'
        }`;

        return item.href ? (
          <Link key={item.id} href={item.href} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={item.id} onClick={() => onChange?.(item.id)} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
