import type { ApiEnvelope } from "../../../shared/types/api";
import type { RegisterPushTokenPayload } from "../types";
import apiClient from "../../../lib/apiClient";

export const pushApi = {
  registerToken: (payload: RegisterPushTokenPayload) =>
    apiClient.post<ApiEnvelope<null>>("/push-tokens", payload),

  deactivateToken: (fcmToken: string) =>
    apiClient.post<ApiEnvelope<null>>("/push-tokens/deactivate", { fcmToken }),
};
