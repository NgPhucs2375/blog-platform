"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { authApi } from "@/services/authApi";
import { tokenStorage, type StoredSession } from "@/services/tokenStorage";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  /** Access token (TTL ngắn). Refresh tự chạy ngầm trong axios khi 401. */
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Khôi phục phiên đồng bộ từ localStorage (persistent qua restart).
  // Access hết hạn thì request đầu tiên 401 -> axios tự refresh + retry,
  // nên không cần effect boot bất đồng bộ ở đây.
  const [boot] = useState<StoredSession>(() => tokenStorage.read());
  const [user, setUser] = useState<User | null>(boot.user);
  const [token, setToken] = useState<string | null>(boot.accessToken);
  const isLoading = false;

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    tokenStorage.save(res.access_token, res.refresh_token, res.user);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = tokenStorage.read();
    // Xóa local trước cho UI phản hồi ngay, thu hồi ở BE sau (best-effort).
    setToken(null);
    setUser(null);
    tokenStorage.clear();
    if (refreshToken) {
      try {
        await authApi.logout({ refresh_token: refreshToken });
      } catch {
        // Token đã hết hạn/bị thu hồi từ trước thì thôi.
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
