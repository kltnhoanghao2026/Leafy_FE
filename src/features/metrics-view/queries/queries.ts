import { useQuery } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { ChartRange } from "../../../types/iot";
import { metricsKeys } from "./keys";

export const useDashboardOverview = (farmPlotId: string, enabled = true) =>
  useQuery({
    queryKey: metricsKeys.dashboardOverview(farmPlotId),
    queryFn: () => collectorApi.getDashboardOverview(farmPlotId),
    select: (response) => response.data,
    enabled: enabled && !!farmPlotId,
  });

export const useZoneOverview = (zoneId: string, enabled = true) =>
  useQuery({
    queryKey: metricsKeys.zoneOverview(zoneId),
    queryFn: () => collectorApi.getZoneOverview(zoneId),
    select: (response) => response.data,
    enabled: enabled && !!zoneId,
  });

export const useZoneChart = (
  zoneId: string,
  sensorCode: string,
  range: ChartRange,
  enabled = true,
) =>
  useQuery({
    queryKey: metricsKeys.zoneChart(zoneId, sensorCode, range),
    queryFn: () => collectorApi.getZoneChart(zoneId, sensorCode, range),
    select: (response) => response.data,
    enabled: enabled && !!zoneId && !!sensorCode && !!range,
  });
