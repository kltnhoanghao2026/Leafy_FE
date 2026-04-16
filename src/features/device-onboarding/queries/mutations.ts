import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type {
  ClaimDeviceRequest,
  ProvisionDeviceRequest,
} from "../../../types/iot";
import { onboardingDeviceKeys } from "./keys";

export const useProvisionDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProvisionDeviceRequest) =>
      collectorApi.provisionDevice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: onboardingDeviceKeys.all(),
      });
    },
    meta: {
      successMessage: "Device provisioned.",
    },
  });
};

export const useGenerateClaimCode = () =>
  useMutation({
    mutationFn: (deviceId: string) => collectorApi.generateClaimCode(deviceId),
    meta: {
      successMessage: "Claim code generated.",
    },
  });

export const useClaimDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClaimDeviceRequest) => collectorApi.claimDevice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: onboardingDeviceKeys.all(),
      });
    },
    meta: {
      successMessage: "Device claimed.",
    },
  });
};
