import { useQuery } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import { farmManagementKeys } from "./keys";

export const useFarmPlots = (ownerProfileId: string, enabled = true) =>
  useQuery({
    queryKey: farmManagementKeys.plots(ownerProfileId),
    queryFn: () => farmApi.getPlotsByOwner(ownerProfileId),
    enabled: enabled && !!ownerProfileId,
  });

export const useFarmZones = (plotId: string, enabled = true) =>
  useQuery({
    queryKey: farmManagementKeys.zones(plotId),
    queryFn: () => farmApi.getZonesByPlot(plotId),
    enabled: enabled && !!plotId,
  });
