import type { ApiEnvelope } from "../../../shared/types/api";
import type { RegisterPushTokenPayload } from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const pushApi = {
  async registerToken(payload: RegisterPushTokenPayload) {
    const response = await apiClient.post<ApiEnvelope<null> | string>(
      API_ENDPOINTS.PUSH_TOKENS.REGISTER,
      payload,
    );
    return response.data;
  },

  async deactivateToken(fcmToken: string) {
    const response = await apiClient.post<ApiEnvelope<null> | string>(
      API_ENDPOINTS.PUSH_TOKENS.DEACTIVATE,
      { fcmToken },
    );
    return response.data;
  },
};
