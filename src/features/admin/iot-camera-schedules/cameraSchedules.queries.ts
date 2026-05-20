import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "../../../i18n";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { DeviceCameraScheduleRequest } from "../../../types/iot";

export const cameraScheduleKeys = {
  all: ["iot-camera-schedules"] as const,
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const useCameraSchedulesQuery = (enabled = true) =>
  useQuery({
    queryKey: cameraScheduleKeys.all,
    queryFn: () => collectorApi.getCameraSchedules(),
    select: (response) => response.data,
    enabled,
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
    onSuccess: async () => {
      toast.success(t("iot.cameraSchedules.toastCreateSuccess"));
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) =>
      toast.error(t("iot.cameraSchedules.toastCreateFailed")(toErrorMessage(error))),
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
