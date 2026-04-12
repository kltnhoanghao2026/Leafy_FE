import type { ApiEnvelope } from "../../../shared/types/api";
import type { ProfileResponse, ProfileUpdateRequest } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import { useAuthStore } from "../../../store/authStore";

// --- Get My Profile ---
export async function apiGetMyProfile(): Promise<ApiEnvelope<ProfileResponse>> {
  const userId = useAuthStore.getState().user?.id;
  const res = await apiClient.get<ApiEnvelope<ProfileResponse>>(
    API_ENDPOINTS.PROFILES.ME,
    {
      headers: userId ? { "X-User-Id": userId } : {},
    },
  );
  return res.data;
}

// --- Get Profile by User ID ---
export async function apiGetProfileByUserId(
  userId: string,
): Promise<ApiEnvelope<ProfileResponse>> {
  const res = await apiClient.get<ApiEnvelope<ProfileResponse>>(
    API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
  );
  return res.data;
}

// --- Update Profile by User ID ---
export async function apiUpdateProfileByUserId(
  userId: string,
  data: ProfileUpdateRequest,
): Promise<ApiEnvelope<ProfileResponse>> {
  const res = await apiClient.put<ApiEnvelope<ProfileResponse>>(
    API_ENDPOINTS.PROFILES.GET_BY_USER(userId),
    data,
  );
  return res.data;
}
