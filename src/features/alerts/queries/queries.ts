import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../../../i18n";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { AlertEventsParams } from "../../../types/iot";
import { withAlertDisplay } from "../../iot/utils/iotDisplay";
import { alertKeys } from "./keys";

export const useAlertEvents = (
  params: AlertEventsParams,
  enabled = true,
) => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: alertKeys.list(params),
    queryFn: () => collectorApi.getAlertEvents(params),
    select: (response) => ({
      ...response.data,
      items: response.data.items.map((alert) => withAlertDisplay(t, alert)),
    }),
    enabled,
  });
};

export const useOpenAlertCount = (enabled = true) =>
  useQuery({
    queryKey: alertKeys.openCount(),
    queryFn: () =>
      collectorApi.getAlertEvents({
        status: "OPEN",
        page: 0,
        size: 1,
        sortBy: "openedAt",
        sortDir: "desc",
      }),
    select: (response) => response.data.totalItems ?? 0,
    enabled,
  });
