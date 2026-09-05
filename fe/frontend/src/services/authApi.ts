import api from "@/lib/axios";
import type {
  ApiResponse,
  AuthResponse,
  AuthSession,
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/auth";

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>("/v1/auth/login", data);
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const res = await api.post<ApiResponse<RegisterResponse>>("/v1/auth/register", data);
    return res.data.data;
  },

  /** Đổi refresh token lấy cặp mới (kèm xoay vòng ở BE). */
  async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    const res = await api.post<ApiResponse<RefreshResponse>>("/v1/auth/refresh", data);
    return res.data.data;
  },

  /** Đăng xuất: thu hồi refresh token ở BE (best-effort). */
  async logout(data: LogoutRequest): Promise<void> {
    await api.post<ApiResponse<null>>("/v1/auth/logout", data);
  },

  /** Các phiên đang hoạt động của chính user. */
  async getSessions(): Promise<AuthSession[]> {
    const res = await api.get<ApiResponse<AuthSession[]>>("/v1/auth/sessions");
    return res.data.data;
  },

  /** Thu hồi 1 phiên (đăng xuất khỏi 1 thiết bị). */
  async revokeSession(id: number): Promise<void> {
    await api.delete<ApiResponse<null>>(`/v1/auth/sessions/${id}`);
  },
};
