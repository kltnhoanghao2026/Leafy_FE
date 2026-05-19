import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { collectorApi } from "../../../lib/api/collectorApi";
import { cameraScheduleKeys } from "../iot-camera-schedules/cameraSchedules.queries";
import type { DiseaseDetectRequest } from "../../../types/iot";

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const useCameraUploadFolderMutation = () =>
  useMutation({
    mutationFn: collectorApi.uploadCameraFolder,
    onSuccess: () => toast.success("Camera images uploaded."),
    onError: (error) => toast.error(`Camera image upload failed: ${toErrorMessage(error)}`),
  });

export const useDiseaseDetectMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceUid, payload }: { deviceUid: string; payload: DiseaseDetectRequest }) =>
      collectorApi.detectCameraDisease(deviceUid, payload),
    onSuccess: async () => {
      toast.success("Disease detection completed.");
      await queryClient.invalidateQueries({ queryKey: cameraScheduleKeys.all });
    },
    onError: (error) => toast.error(`Disease detection failed: ${toErrorMessage(error)}`),
  });
};
