export interface User {
  id: number;
  userName: string;
  email: string;
  role: "Admin" | "User";
  status: "Active" | "Locked";
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface AuthResponse extends TokenPair {
  user: User;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse extends TokenPair {
  user: User;
}

export interface LogoutRequest {
  refresh_token?: string;
}

export interface AuthSession {
  id: number;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
}

export interface RegisterResponse {
  userId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  users: User[];
  pagination: Pagination;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface UpdateRoleRequest {
  role: "Admin" | "User";
}

export interface UpdateProfileRequest {
  userName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
