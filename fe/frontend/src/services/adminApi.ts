import api from "@/lib/axios";
import type {
  ApiResponse,
  UserListResponse,
  User,
  UserListParams,
  UpdateRoleRequest,
  CreateUserRequest,
  BulkIdsRequest,
  BulkResult,
} from "@/types/auth";

export const adminApi = {
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.role) searchParams.set("role", params.role);
    if (params.status) searchParams.set("status", params.status);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.includeDeleted) searchParams.set("includeDeleted", "1");

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

  async createUser(data: CreateUserRequest): Promise<User> {
    const res = await api.post<ApiResponse<User>>(`/v1/admin/users`, data);
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

  async restoreUser(id: number): Promise<User> {
    const res = await api.post<ApiResponse<User>>(
      `/v1/admin/users/${id}/restore`
    );
    return res.data.data;
  },

  async deleteUser(id: number, permanent = false): Promise<void> {
    await api.delete(
      `/v1/admin/users/${id}${permanent ? "?permanent=1" : ""}`
    );
  },

  async bulkLock(ids: number[]): Promise<BulkResult> {
    const res = await api.post<ApiResponse<BulkResult>>(
      `/v1/admin/users/bulk-lock`,
      { ids } satisfies BulkIdsRequest
    );
    return res.data.data;
  },

  async bulkUnlock(ids: number[]): Promise<BulkResult> {
    const res = await api.post<ApiResponse<BulkResult>>(
      `/v1/admin/users/bulk-unlock`,
      { ids } satisfies BulkIdsRequest
    );
    return res.data.data;
  },

  async bulkDelete(ids: number[]): Promise<BulkResult> {
    const res = await api.post<ApiResponse<BulkResult>>(
      `/v1/admin/users/bulk-delete`,
      { ids } satisfies BulkIdsRequest
    );
    return res.data.data;
  },
};
