'use client';

import React from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  /** Kích thước nút: 'sm' (36px, dùng trong topbar admin) mặc định 36px */
  className?: string;
}

/** Nút chuyển giao diện sáng/tối, đồng bộ với ThemeContext. */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();
  
  if (!mounted) {
    return <div className={`h-9 w-9 rounded-xl border border-line bg-surface ${className}`} />;
  }
  
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted shadow-sm transition hover:text-ink ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
