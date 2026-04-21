import type { ChartRange } from "../../../types/iot";

export const deviceKeys = {
  all: () => ["iot-devices"] as const,
  detail: (deviceId: string) =>
    [...deviceKeys.all(), "detail", deviceId] as const,
  latestReadings: (deviceId: string) =>
    [...deviceKeys.all(), "latest-readings", deviceId] as const,
  chart: (deviceId: string, sensorCode: string, range: ChartRange) =>
    [...deviceKeys.all(), "chart", deviceId, sensorCode, range] as const,
  config: (deviceId: string) =>
    [...deviceKeys.all(), "config", deviceId] as const,
};
