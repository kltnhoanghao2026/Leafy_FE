import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { UpdateDeviceConfigRequest } from "../../../types/iot";
import { deviceKeys } from "./keys";

export const useUpdateDeviceConfig = (deviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDeviceConfigRequest) =>
      collectorApi.updateDeviceConfig(deviceId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceKeys.config(deviceId) }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.detail(deviceId) }),
      ]);
    },
    meta: {
      successMessage: "Device config saved.",
    },
  });
};

export const usePushDeviceConfig = (deviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => collectorApi.pushDeviceConfig(deviceId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceKeys.config(deviceId) }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.detail(deviceId) }),
      ]);
    },
    meta: {
      successMessage: "Device config push requested.",
    },
  });
};
