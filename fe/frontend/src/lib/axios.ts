import axios, { type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/services/tokenStorage";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoint thuộc auth-flow: 401 ở đây là lỗi nghiệp vụ (sai pass,
// refresh hết hạn...) — page tự hiển thị, KHÔNG tự refresh/trắng trang.
const NO_AUTO_REFRESH_URLS = [
  "/v1/auth/login",
  "/v1/auth/register",
  "/v1/auth/refresh",
  "/v1/auth/logout",
];

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Single-flight: nhiều request 401 cùng lúc chỉ đổi token 1 lần.
let refreshPromise: Promise<boolean> | null = null;

function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = tokenStorage.read();
      if (!refreshToken) return false;
      try {
        // Dùng axios trần (không qua instance này) để tránh đệ quy interceptor.
        const res = await axios.post(`${baseURL}/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const pair = res.data?.data as
          | { access_token: string; refresh_token: string }
          | undefined;
        if (!pair?.access_token || !pair?.refresh_token) return false;
        tokenStorage.savePair(pair.access_token, pair.refresh_token);
        return true;
      } catch {
        tokenStorage.clear();
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function hardLogout(): void {
  tokenStorage.clear();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use((config) => {
  const { accessToken } = tokenStorage.read();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const isAuthFlow = NO_AUTO_REFRESH_URLS.some((u) => url.includes(u));

    // Access hết hạn giữa chừng -> lặng lẽ xin cặp mới rồi thử lại 1 lần.
    if (status === 401 && original && !original._retry && !isAuthFlow) {
      original._retry = true;
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        const { accessToken } = tokenStorage.read();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
      hardLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
