import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import { alertKeys } from "./keys";

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertEventId: string) =>
      collectorApi.acknowledgeAlert(alertEventId),
    onSuccess: async (_response, alertEventId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: alertKeys.detail(alertEventId),
        }),
      ]);
    },
    meta: {
      successMessage: "Alert acknowledged.",
    },
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertEventId: string) => collectorApi.resolveAlert(alertEventId),
    onSuccess: async (_response, alertEventId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: alertKeys.detail(alertEventId),
        }),
      ]);
    },
    meta: {
      successMessage: "Alert resolved.",
    },
  });
};
