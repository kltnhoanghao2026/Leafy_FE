import { useQuery } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { AlertEventsParams } from "../../../types/iot";
import { alertKeys } from "./keys";

export const useAlertEvents = (
  params: AlertEventsParams,
  enabled = true,
) =>
  useQuery({
    queryKey: alertKeys.list(params),
    queryFn: () => collectorApi.getAlertEvents(params),
    select: (response) => response.data,
    enabled,
  });
