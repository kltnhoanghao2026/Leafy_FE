import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantsApi } from "./plants.api";
import { plantKeys } from "./plantKeys";
import type { PlantListParams } from "./types";

export const useAdminPlants = (params: PlantListParams = {}) =>
  useQuery({
    queryKey: plantKeys.list(params),
    queryFn: () => plantsApi.listPlants(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const usePlant = (id: string) =>
  useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => plantsApi.getPlantById(id),
    select: (res) => res.data.data,
    enabled: !!id,
    staleTime: 30_000,
  });

export const useDeletePlant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plantsApi.deletePlant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantKeys.all() });
    },
  });
};

export const usePlantsByFarmPlot = (farmPlotId: string) =>
  useQuery({
    queryKey: plantKeys.byFarmPlot(farmPlotId),
    queryFn: () => plantsApi.getPlantsByFarmPlot(farmPlotId),
    select: (res) => res.data.data,
    enabled: !!farmPlotId,
    staleTime: 60_000,
  });
