import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { DeviceResponse, UpdateDeviceConfigRequest, UpdateDeviceRequest } from "../../../types/iot";
import { cameraScheduleKeys } from "../../admin/iot-camera-schedules/cameraSchedules.queries";
import { onboardingDeviceKeys } from "../../device-onboarding/queries/keys";
import { metricsKeys } from "../../metrics-view/queries/keys";
import { deviceKeys } from "./keys";

export const useUpdateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deviceId,
      payload,
    }: {
      deviceId: string;
      payload: UpdateDeviceRequest;
    }) => collectorApi.updateDevice(deviceId, payload),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingDeviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: metricsKeys.all() }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.deviceId) }),
      ]);
    },
  });
};

export const useReleaseDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId }: { deviceId: string }) =>
      collectorApi.releaseDevice(deviceId),
    onSuccess: async (response, variables) => {
      const releasedDevice = response.data as DeviceResponse;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingDeviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: metricsKeys.all() }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.detail(variables.deviceId) }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.config(variables.deviceId) }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all }),
        releasedDevice.deviceUid
          ? queryClient.invalidateQueries({
              queryKey: cameraScheduleKeys.device(releasedDevice.deviceUid),
            })
          : Promise.resolve(),
      ]);
    },
  });
};

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

export const useCaptureDeviceImage = (deviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      collectorApi.captureDeviceImage(deviceId, {
        quality: "MEDIUM",
        resolution: "VGA",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: deviceKeys.all() }),
        queryClient.invalidateQueries({ queryKey: deviceKeys.detail(deviceId) }),
      ]);
    },
    meta: {
      successMessage: "Camera capture requested.",
    },
  });
};
