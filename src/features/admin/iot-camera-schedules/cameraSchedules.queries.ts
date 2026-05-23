import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "../../../i18n";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { DeviceCameraScheduleRequest, DeviceCameraScheduleResponse } from "../../../types/iot";

export const cameraScheduleKeys = {
  all: ["iot-camera-schedules"] as const,
  device: (deviceUid?: string) => ["iot-camera-schedules", "device", deviceUid] as const,
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const getScheduleId = (schedule: DeviceCameraScheduleResponse) =>
  schedule.scheduleId ?? schedule.id;

const updateScheduleCache = (
  current: unknown,
  updater: (schedules: DeviceCameraScheduleResponse[]) => DeviceCameraScheduleResponse[],
) => {
  if (Array.isArray(current)) {
    return updater(current);
  }

  if (current && typeof current === "object" && "data" in current) {
    const response = current as { data?: unknown };
    if (Array.isArray(response.data)) {
      return { ...response, data: updater(response.data) };
    }
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      const envelope = response.data as { data?: unknown };
      if (Array.isArray(envelope.data)) {
        return { ...response, data: { ...envelope, data: updater(envelope.data) } };
      }
    }
  }

  return current;
};

export const useCameraSchedulesQuery = (enabled = true, refetchInterval?: number | false) =>
  useQuery({
    queryKey: cameraScheduleKeys.all,
    queryFn: () => collectorApi.getCameraSchedules(),
    select: (response) => response.data,
    enabled,
    refetchInterval,
  });

export const useDeviceSchedulesQuery = (
  deviceUid?: string,
  enabled = true,
  refetchInterval?: number | false,
) =>
  useQuery({
    queryKey: cameraScheduleKeys.device(deviceUid),
    queryFn: () => collectorApi.getDeviceSchedules(deviceUid as string),
    select: (response) => response.data,
    enabled: enabled && Boolean(deviceUid),
    refetchInterval,
  });

export const useCreateCameraScheduleMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (payload: DeviceCameraScheduleRequest) =>
      collectorApi.createCameraSchedule(payload),
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastCreateSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastCreateFailed")(toErrorMessage(error))),
  });
};

export const useCreateDeviceCameraScheduleMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      deviceUid,
      payload,
    }: {
      deviceUid: string;
      payload: Pick<DeviceCameraScheduleRequest, "enabled" | "timeOfDay" | "recurrence" | "resolution" | "quality" | "uploadEndpoint">;
    }) => collectorApi.createDeviceCameraSchedule(deviceUid, payload),
    onMutate: async ({ deviceUid, payload }) => {
      await queryClient.cancelQueries({ queryKey: cameraScheduleKeys.device(deviceUid) });
      const previous = queryClient.getQueryData(cameraScheduleKeys.device(deviceUid));
      queryClient.setQueryData(cameraScheduleKeys.device(deviceUid), (current) => {
        const optimisticSchedule: DeviceCameraScheduleResponse = {
          id: `optimistic-${Date.now()}`,
          scheduleId: `optimistic-${Date.now()}`,
          deviceUid,
          enabled: payload.enabled ?? true,
          triggerType: "SCHEDULED",
          timeOfDay: payload.timeOfDay,
          recurrence: payload.recurrence,
          resolution: payload.resolution,
          quality: payload.quality,
          uploadEndpoint: payload.uploadEndpoint,
          lastRunAt: null,
          nextRunAt: null,
        };

        const updated = updateScheduleCache(current, (schedules) => [
          {
            ...optimisticSchedule,
          },
          ...schedules,
        ]);

        return updated === current ? [optimisticSchedule] : updated;
      });
      return { previous, deviceUid };
    },
    onError: (error, _variables, context) => {
      if (context?.deviceUid) {
        queryClient.setQueryData(cameraScheduleKeys.device(context.deviceUid), context.previous);
      }
      toast.error(t("iot.cameraSchedules.toastCreateFailed")(toErrorMessage(error)));
    },
    onSuccess: async (_response, variables) => {
      toast.success(t("iot.cameraSchedules.toastCreateSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all }),
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.device(variables.deviceUid) }),
      ]);
    },
  });
};

export const useUpdateDeviceScheduleMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ scheduleId, payload, deviceUid: inputDeviceUid }: { scheduleId: string; payload: DeviceCameraScheduleRequest; deviceUid?: string }) =>
      collectorApi.updateDeviceSchedule(inputDeviceUid ?? (deviceUid as string), scheduleId, payload),
    onMutate: async ({ scheduleId, payload, deviceUid: inputDeviceUid }) => {
      const targetDeviceUid = inputDeviceUid ?? deviceUid;
      if (!targetDeviceUid) return undefined;
      await queryClient.cancelQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) });
      const previous = queryClient.getQueryData(cameraScheduleKeys.device(targetDeviceUid));
      queryClient.setQueryData(cameraScheduleKeys.device(targetDeviceUid), (current) =>
        updateScheduleCache(current, (schedules) =>
          schedules.map((schedule) =>
            getScheduleId(schedule) === scheduleId ? { ...schedule, ...payload } : schedule,
          ),
        ),
      );
      return { previous, deviceUid: targetDeviceUid };
    },
    onError: (error, _variables, context) => {
      if (context?.deviceUid && context?.previous) {
        queryClient.setQueryData(cameraScheduleKeys.device(context.deviceUid), context.previous);
      }
      toast.error(t("iot.cameraSchedules.toastUpdateFailed")(toErrorMessage(error)));
    },
    onSuccess: async (_response, variables) => {
      const targetDeviceUid = variables.deviceUid ?? deviceUid;
      toast.success(t("iot.cameraSchedules.toastUpdateSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all }),
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) }),
      ]);
    },
  });
};

export const useDeleteDeviceScheduleMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: string | { scheduleId: string; deviceUid?: string }) => {
      const scheduleId = typeof input === "string" ? input : input.scheduleId;
      const targetDeviceUid = typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      return collectorApi.deleteDeviceSchedule(targetDeviceUid as string, scheduleId);
    },
    onMutate: async (input) => {
      const scheduleId = typeof input === "string" ? input : input.scheduleId;
      const targetDeviceUid = typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      if (!targetDeviceUid) return undefined;
      await queryClient.cancelQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) });
      const previous = queryClient.getQueryData(cameraScheduleKeys.device(targetDeviceUid));
      queryClient.setQueryData(cameraScheduleKeys.device(targetDeviceUid), (current) =>
        updateScheduleCache(current, (schedules) =>
          schedules.filter((schedule) => getScheduleId(schedule) !== scheduleId),
        ),
      );
      return { previous, deviceUid: targetDeviceUid };
    },
    onError: (error, _scheduleId, context) => {
      if (context?.deviceUid && context?.previous) {
        queryClient.setQueryData(cameraScheduleKeys.device(context.deviceUid), context.previous);
      }
      toast.error(t("iot.cameraSchedules.toastDeleteFailed")(toErrorMessage(error)));
    },
    onSuccess: async (_response, variables) => {
      const targetDeviceUid = typeof variables === "string" ? deviceUid : variables.deviceUid ?? deviceUid;
      toast.success(t("iot.cameraSchedules.toastDeleteSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all }),
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) }),
      ]);
    },
  });
};

export const useRunScheduledCameraMutation = (deviceUid?: string) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (input: string | { scheduleId: string; deviceUid?: string }) => {
      const scheduleId = typeof input === "string" ? input : input.scheduleId;
      const targetDeviceUid = typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      return collectorApi.runScheduledCamera(targetDeviceUid as string, scheduleId);
    },
    onMutate: async (input) => {
      const scheduleId = typeof input === "string" ? input : input.scheduleId;
      const targetDeviceUid = typeof input === "string" ? deviceUid : input.deviceUid ?? deviceUid;
      if (!targetDeviceUid) return undefined;
      await queryClient.cancelQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) });
      const previous = queryClient.getQueryData(cameraScheduleKeys.device(targetDeviceUid));
      queryClient.setQueryData(cameraScheduleKeys.device(targetDeviceUid), (current) =>
        updateScheduleCache(current, (schedules) =>
          schedules.map((schedule) =>
            getScheduleId(schedule) === scheduleId
              ? { ...schedule, status: "RUNNING", lastRunAt: new Date().toISOString() }
              : schedule,
          ),
        ),
      );
      return { previous, deviceUid: targetDeviceUid };
    },
    onError: (error, _scheduleId, context) => {
      if (context?.deviceUid && context?.previous) {
        queryClient.setQueryData(cameraScheduleKeys.device(context.deviceUid), context.previous);
      }
      toast.error(t("iot.cameraSchedules.toastRunFailed")(toErrorMessage(error)));
    },
    onSuccess: async (_response, variables) => {
      const targetDeviceUid = typeof variables === "string" ? deviceUid : variables.deviceUid ?? deviceUid;
      toast.success(t("iot.cameraSchedules.toastRunSuccess"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all }),
        queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.device(targetDeviceUid) }),
      ]);
    },
  });
};

export const useUpdateCameraScheduleMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      scheduleId,
      payload,
    }: {
      scheduleId: string;
      payload: DeviceCameraScheduleRequest;
    }) => collectorApi.updateCameraSchedule(scheduleId, payload),
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastUpdateSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastUpdateFailed")(toErrorMessage(error))),
  });
};

export const useDeleteCameraScheduleMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (scheduleId: string) => collectorApi.deleteCameraSchedule(scheduleId),
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastDeleteSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastDeleteFailed")(toErrorMessage(error))),
  });
};

export const useRunCameraScheduleNowMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (scheduleId: string) => collectorApi.runCameraScheduleNow(scheduleId),
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastRunSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastRunFailed")(toErrorMessage(error))),
  });
};

export const useRunScheduledCameraForDeviceMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (deviceUid: string) =>
      collectorApi.runScheduledCameraForDevice(deviceUid),
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastRunSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastRunFailed")(toErrorMessage(error))),
  });
};
