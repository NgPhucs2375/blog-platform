"use client";

import type { User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Kho lưu phiên đăng nhập (localStorage = persistent qua lần tắt/mở trình duyệt).
// - access_token: TTL ngắn (15'), gắn vào mọi request API.
// - refresh_token: TTL dài (30 ngày), chỉ dùng để xin cặp mới.
// - user: cache hiển thị, nguồn thật vẫn là API.
// ---------------------------------------------------------------------------

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

// Key đời cũ (JWT dài hạn, đã bỏ) — dọn để không kẹt phiên ma.
const LEGACY_KEYS = ["token", "user"] as const;

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const tokenStorage = {
  read(): StoredSession {
    const userRaw = read(USER_KEY);
    let user: User | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as User;
      } catch {
        user = null;
      }
    }
    return {
      accessToken: read(ACCESS_KEY),
      refreshToken: read(REFRESH_KEY),
      user,
    };
  },

  save(accessToken: string, refreshToken: string, user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  },

  savePair(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  },
};
