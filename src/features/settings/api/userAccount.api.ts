import type { ApiEnvelope } from "../../../shared/types/api";
import type { UserResponse } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const userAccountApi = {
  getMyAccount: () =>
    apiClient.get<ApiEnvelope<UserResponse>>(API_ENDPOINTS.USERS.ME),
};
