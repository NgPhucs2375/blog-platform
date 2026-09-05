import api from "@/lib/axios";
import type {
  ApiResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/auth";

export const profileApi = {
  async getProfile(): Promise<User> {
    const res = await api.get<ApiResponse<User>>("/v1/profile");
    return res.data.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await api.put<ApiResponse<User>>("/v1/profile", data);
    return res.data.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put<ApiResponse<null>>("/v1/profile/password", data);
  },
};
