import type { ApiEnvelope } from "../../../shared/types/api";
import type { RegisterPushTokenPayload } from "../types";
import apiClient from "../../../lib/apiClient";

export async function apiRegisterPushToken(payload: RegisterPushTokenPayload) {
  const res = await apiClient.post<ApiEnvelope<null>>("/push-tokens", payload);
  return res.data;
}

export async function apiDeactivatePushToken(fcmToken: string) {
  const res = await apiClient.post<ApiEnvelope<null>>(
    "/push-tokens/deactivate",
    { fcmToken },
  );
  return res.data;
}
