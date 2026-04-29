import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  AdminProfileDto,
  AdminProfileDetailsDto,
  ProfileListParams,
  SpringPage,
} from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const profilesApi = {
  listProfiles: (params: ProfileListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<AdminProfileDto>>>(
      API_ENDPOINTS.PROFILES.LIST,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
          ...(params.searchTerm ? { searchTerm: params.searchTerm } : {}),
          ...(params.role !== undefined ? { role: params.role } : {}),
          ...(params.active !== undefined ? { active: params.active } : {}),
          ...(params.isVerified !== undefined
            ? { isVerified: params.isVerified }
            : {}),
        },
      },
    ),

  searchProfiles: (searchTerm: string, params: ProfileListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<AdminProfileDto>>>(
      API_ENDPOINTS.PROFILES.SEARCH,
      {
        params: {
          searchTerm,
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
        },
      },
    ),

  getProfileDetails: (profileId: string) =>
    apiClient.get<ApiEnvelope<AdminProfileDetailsDto>>(
      API_ENDPOINTS.PROFILES.DETAILS(profileId),
    ),

  activateProfile: (profileId: string) =>
    apiClient.patch<ApiEnvelope<AdminProfileDto>>(
      API_ENDPOINTS.PROFILES.ACTIVATE(profileId),
    ),

  deactivateProfile: (profileId: string) =>
    apiClient.patch<ApiEnvelope<AdminProfileDto>>(
      API_ENDPOINTS.PROFILES.DEACTIVATE(profileId),
    ),

  verifyProfile: (profileId: string) =>
    apiClient.patch<ApiEnvelope<AdminProfileDto>>(
      API_ENDPOINTS.PROFILES.VERIFY(profileId),
    ),
};
