import { useMutation } from "@tanstack/react-query";
import { pushApi } from "../api/push.api";
import { pushKeys } from "./keys";
import type { RegisterPushTokenPayload } from "../types";

export const useRegisterPushTokenMutation = () =>
  useMutation({
    mutationKey: pushKeys.register(),
    mutationFn: (payload: RegisterPushTokenPayload) =>
      pushApi.registerToken(payload),
  });

export const useDeactivatePushTokenMutation = () =>
  useMutation({
    mutationKey: pushKeys.deactivate(),
    mutationFn: (fcmToken: string) => pushApi.deactivateToken(fcmToken),
  });
