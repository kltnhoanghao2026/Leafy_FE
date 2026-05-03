import type { ApiEnvelope } from "../../../../shared/types/api";
import type { AdminUserDto, SpringPage, UserListParams } from "../../types";
import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";

export const usersApi = {
  listUsers: (params: UserListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<AdminUserDto>>>(
      API_ENDPOINTS.USERS.LIST,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
        },
      },
    ),

  searchUsers: (searchTerm: string, params: UserListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<AdminUserDto>>>(
      API_ENDPOINTS.USERS.SEARCH,
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

  activateUser: (userId: string) =>
    apiClient.patch<ApiEnvelope<AdminUserDto>>(
      API_ENDPOINTS.USERS.ACTIVATE(userId),
    ),

  deactivateUser: (userId: string) =>
    apiClient.patch<ApiEnvelope<AdminUserDto>>(
      API_ENDPOINTS.USERS.DEACTIVATE(userId),
    ),
};
