import { useMutation, useQueryClient } from "@tanstack/react-query";
import { farmApi } from "../api/farm.api";
import type {
  CreateFarmPlotRequest,
  CreateFarmZoneRequest,
  UpdateFarmPlotRequest,
  UpdateFarmZoneRequest,
} from "../types";
import { farmManagementKeys } from "./keys";

export const useCreateFarmPlot = (ownerProfileId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFarmPlotRequest) => farmApi.createPlot(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: farmManagementKeys.plots(ownerProfileId),
      });
    },
    meta: {
      successMessage: "Farm plot created.",
    },
  });
};

export const useUpdateFarmPlot = (ownerProfileId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plotId,
      payload,
    }: {
      plotId: string;
      payload: UpdateFarmPlotRequest;
    }) => farmApi.updatePlot(plotId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: farmManagementKeys.plots(ownerProfileId),
      });
    },
    meta: {
      successMessage: "Farm plot updated.",
    },
  });
};

export const useDeleteFarmPlot = (ownerProfileId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plotId: string) => farmApi.deletePlot(plotId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: farmManagementKeys.plots(ownerProfileId),
        }),
        queryClient.invalidateQueries({
          queryKey: farmManagementKeys.zonesRoot(),
        }),
      ]);
    },
    meta: {
      successMessage: "Farm plot removed.",
    },
  });
};

export const useCreateFarmZone = (plotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFarmZoneRequest) => farmApi.createZone(plotId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: farmManagementKeys.zones(plotId),
      });
    },
    meta: {
      successMessage: "Farm zone created.",
    },
  });
};

export const useUpdateFarmZone = (plotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      zoneId,
      payload,
    }: {
      zoneId: string;
      payload: UpdateFarmZoneRequest;
    }) => farmApi.updateZone(zoneId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: farmManagementKeys.zones(plotId),
      });
    },
    meta: {
      successMessage: "Farm zone updated.",
    },
  });
};

export const useDeleteFarmZone = (plotId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (zoneId: string) => farmApi.deleteZone(zoneId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: farmManagementKeys.zones(plotId),
      });
    },
    meta: {
      successMessage: "Farm zone removed.",
    },
  });
};
