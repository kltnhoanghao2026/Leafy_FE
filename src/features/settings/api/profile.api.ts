import type { ApiEnvelope } from "../../../shared/types/api";
import type { ProfileResponse, ProfileUpdateRequest } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import { useAuthStore } from "../../../store/authStore";

export const profileApi = {
  getMyProfile: () => {
    const userId = useAuthStore.getState().user?.id;
    return apiClient.get<ApiEnvelope<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.ME,
      {
        headers: userId ? { "X-User-Id": userId } : {},
      },
    );
  },

  getByUserId: (userId: string) =>
    apiClient.get<ApiEnvelope<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
    ),

  updateByUserId: (userId: string, data: ProfileUpdateRequest) =>
    apiClient.put<ApiEnvelope<ProfileResponse>>(
      API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
      data,
    ),
};
