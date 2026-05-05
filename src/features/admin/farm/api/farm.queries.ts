import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { farmsApi } from "./farm.api";
import { farmKeys } from "./farmKeys";
import type { FarmPlotListParams, FarmZoneListParams } from "../../types";

export const useAdminFarmPlots = (params: FarmPlotListParams = {}) =>
  useQuery({
    queryKey: farmKeys.plotList(params),
    queryFn: () => farmsApi.listPlots(params),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

export const useAdminFarmZones = (params: FarmZoneListParams = {}) =>
  useQuery({
    queryKey: farmKeys.zoneList(params),
    queryFn: () => farmsApi.listZones(params),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

export const usePlotZones = (plotId: string) =>
  useQuery({
    queryKey: farmKeys.plotZones(plotId),
    queryFn: () => farmsApi.getPlotZones(plotId),
    select: (response) => response.data.data,
    enabled: !!plotId,
    staleTime: 30_000,
  });

export const useDeleteFarmPlot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmsApi.deletePlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.all() });
    },
  });
};

export const useAdminFarmPlotDetail = (plotId: string) =>
  useQuery({
    queryKey: farmKeys.plotDetail(plotId),
    queryFn: () => farmsApi.getPlot(plotId),
    select: (response) => response.data.data,
    enabled: plotId.length > 0,
    staleTime: 60_000,
  });

export const useAdminFarmZoneDetail = (zoneId: string) =>
  useQuery({
    queryKey: farmKeys.zoneDetail(zoneId),
    queryFn: () => farmsApi.getZone(zoneId),
    select: (response) => response.data.data,
    enabled: zoneId.length > 0,
    staleTime: 60_000,
  });

export const useDeleteFarmZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => farmsApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.all() });
    },
  });
};

export const useFarmPlotsByOwner = (profileId: string) =>
  useQuery({
    queryKey: farmKeys.byOwner(profileId),
    queryFn: () => farmsApi.getPlotsByOwner(profileId),
    select: (response) => response.data.data,
    enabled: profileId.length > 0,
    staleTime: 60_000,
  });
