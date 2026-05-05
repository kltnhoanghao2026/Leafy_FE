import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  AppearanceSettingsUpdateRequest,
  GeneralSettingsUpdateRequest,
  SecuritySettingsUpdateRequest,
  PrivacySettingsUpdateRequest,
  MessageSettingsUpdateRequest,
  NotificationSettingsUpdateRequest,
  SyncSettingsUpdateRequest,
  UtilitiesSettingsUpdateRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  UserPreferenceResponse,
} from "../types";
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

  getMyPreferences: () =>
    apiClient.get<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.ME,
    ),

  updateAppearancePreferences: (data: AppearanceSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.APPEARANCE,
      data,
    ),

  updateGeneralPreferences: (data: GeneralSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.GENERAL,
      data,
    ),

  updateSecurityPreferences: (data: SecuritySettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.SECURITY,
      data,
    ),

  updatePrivacyPreferences: (data: PrivacySettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.PRIVACY,
      data,
    ),

  updateMessagePreferences: (data: MessageSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.MESSAGE,
      data,
    ),

  updateNotificationPreferences: (data: NotificationSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.NOTIFICATION,
      data,
    ),

  updateSyncPreferences: (data: SyncSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.SYNC,
      data,
    ),

  updateUtilitiesPreferences: (data: UtilitiesSettingsUpdateRequest) =>
    apiClient.patch<ApiEnvelope<UserPreferenceResponse>>(
      API_ENDPOINTS.PREFERENCES.UTILITIES,
      data,
    ),
};
