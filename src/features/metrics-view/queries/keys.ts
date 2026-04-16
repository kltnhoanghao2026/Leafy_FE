import type { ChartRange } from "../../../types/iot";

export const metricsKeys = {
  all: () => ["iot-metrics"] as const,
  dashboardOverview: (farmPlotId: string) =>
    [...metricsKeys.all(), "dashboard-overview", farmPlotId] as const,
  zoneOverview: (zoneId: string) =>
    [...metricsKeys.all(), "zone-overview", zoneId] as const,
  zoneChart: (zoneId: string, sensorCode: string, range: ChartRange) =>
    [...metricsKeys.all(), "zone-chart", zoneId, sensorCode, range] as const,
};
