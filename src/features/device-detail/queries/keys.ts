import type { ChartRange } from "../../../types/iot";

export const deviceKeys = {
  all: () => ["iot-devices"] as const,
  detail: (deviceId: string) =>
    [...deviceKeys.all(), "detail", deviceId] as const,
  latestReadings: (deviceId: string, zoneId?: string) =>
    [...deviceKeys.all(), "latest-readings", deviceId, zoneId ?? "device-history"] as const,
  chart: (deviceId: string, sensorCode: string, range: ChartRange, zoneId?: string) =>
    [...deviceKeys.all(), "chart", deviceId, sensorCode, range, zoneId ?? "device-history"] as const,
  config: (deviceId: string) =>
    [...deviceKeys.all(), "config", deviceId] as const,
  media: (deviceId: string, zoneId?: string) =>
    [...deviceKeys.all(), "media", deviceId, zoneId ?? "device-history"] as const,
};
