import type { ApiEnvelope } from "../../../shared/types/api";
import type { SystemHealthResponse } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const healthApi = {
  getSystemHealth: () =>
    apiClient.get<ApiEnvelope<SystemHealthResponse>>(
      API_ENDPOINTS.ADMIN.HEALTH,
    ),
};
