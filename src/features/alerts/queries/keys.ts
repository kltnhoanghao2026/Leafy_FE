import type { AlertEventsParams } from "../../../types/iot";

export const alertKeys = {
  all: () => ["iot-alert-events"] as const,
  list: (params: AlertEventsParams) =>
    [...alertKeys.all(), "list", params] as const,
};
