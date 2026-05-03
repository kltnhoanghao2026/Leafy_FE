import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantApi } from "../api/plant.api";
import type { PlantCreateRequest, PlantUpdateRequest } from '../../shared/types';
import { plantManagementKeys } from '../../shared/queries/keys';

export const usePlants = () =>
  useQuery({
    queryKey: plantManagementKeys.plants(),
    queryFn: plantApi.getPlants,
  });

export const useMyPlants = (params: import('../../shared/types').PlantListParams = {}) =>
  useQuery({
    queryKey: [...plantManagementKeys.plantsRoot(), "me", params],
    queryFn: () => plantApi.getMyPlants(params),
  });

export const usePlant = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plant(plantId),
    queryFn: () => plantApi.getPlantById(plantId),
    enabled: enabled && !!plantId,
  });

export const usePlantsByFarmPlot = (farmPlotId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantsByFarmPlot(farmPlotId),
    queryFn: () => plantApi.getPlantsByFarmPlot(farmPlotId),
    enabled: enabled && !!farmPlotId,
  });

export const usePlantsBySpecies = (speciesId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantsBySpecies(speciesId),
    queryFn: () => plantApi.getPlantsBySpecies(speciesId),
    enabled: enabled && !!speciesId,
  });

export const useCreatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlantCreateRequest) => plantApi.createPlant(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: plantManagementKeys.plantsRoot(),
      });
    },
    meta: {
      successMessage: "Đã thêm cây trồng.",
    },
  });
};

export const useUpdatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantId,
      payload,
    }: {
      plantId: string;
      payload: PlantUpdateRequest;
    }) => plantApi.updatePlant(plantId, payload),
    onSuccess: async (plant) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantsRoot(),
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plant(plant.id),
        }),
      ]);
    },
    meta: {
      successMessage: "Đã cập nhật cây trồng.",
    },
  });
};

export const useDeletePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plantId: string) => plantApi.deletePlant(plantId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: plantManagementKeys.plantsRoot(),
      });
    },
    meta: {
      successMessage: "Đã xóa cây trồng.",
    },
  });
};
