import type { AlertEventsParams } from "../../../types/iot";

export const alertKeys = {
  all: () => ["iot-alert-events"] as const,
  openCount: () => [...alertKeys.all(), "open-count"] as const,
  list: (params: AlertEventsParams) =>
    [...alertKeys.all(), "list", params] as const,
  detail: (alertEventId: string) =>
    [...alertKeys.all(), "detail", alertEventId] as const,
};
