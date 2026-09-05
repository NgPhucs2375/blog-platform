import api from "@/lib/axios";
import type {
  ApiResponse,
  UserListResponse,
  User,
  UserListParams,
  UpdateRoleRequest,
} from "@/types/auth";

export const adminApi = {
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);

    const qs = searchParams.toString();
    const res = await api.get<ApiResponse<UserListResponse>>(
      `/v1/admin/users${qs ? `?${qs}` : ""}`
    );
    return res.data.data;
  },

  async getUser(id: number): Promise<User> {
    const res = await api.get<ApiResponse<User>>(`/v1/admin/users/${id}`);
    return res.data.data;
  },

  async updateRole(id: number, data: UpdateRoleRequest): Promise<User> {
    const res = await api.put<ApiResponse<User>>(
      `/v1/admin/users/${id}/role`,
      data
    );
    return res.data.data;
  },

  async lockUser(id: number): Promise<User> {
    const res = await api.post<ApiResponse<User>>(
      `/v1/admin/users/${id}/lock`
    );
    return res.data.data;
  },

  async unlockUser(id: number): Promise<User> {
    const res = await api.post<ApiResponse<User>>(
      `/v1/admin/users/${id}/unlock`
    );
    return res.data.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/v1/admin/users/${id}`);
  },
};
