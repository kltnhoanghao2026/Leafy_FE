import type { FarmPlotListParams, FarmZoneListParams } from "../../types";

export const farmKeys = {
  all: () => ["adminFarms"] as const,
  plots: () => [...farmKeys.all(), "plots"] as const,
  plotList: (params: FarmPlotListParams) =>
    [...farmKeys.plots(), params] as const,
  zones: () => [...farmKeys.all(), "zones"] as const,
  zoneList: (params: FarmZoneListParams) =>
    [...farmKeys.zones(), params] as const,
  plotZones: (plotId: string) =>
    [...farmKeys.zones(), "byPlot", plotId] as const,
  plotDetail: (plotId: string) =>
    [...farmKeys.plots(), "detail", plotId] as const,
  zoneDetail: (zoneId: string) =>
    [...farmKeys.zones(), "detail", zoneId] as const,
  byOwner: (profileId: string) =>
    [...farmKeys.plots(), "byOwner", profileId] as const,
};
