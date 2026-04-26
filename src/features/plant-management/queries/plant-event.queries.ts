import { useQuery } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import { plantManagementKeys } from "./keys";

export const usePlantEvents = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantEvents(plantId),
    queryFn: () => plantEventApi.getPlantEvents(plantId),
    enabled: enabled && !!plantId,
  });

export const usePlannedPlantEvents = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plannedPlantEvents(plantId),
    queryFn: () => plantEventApi.getPlannedPlantEvents(plantId),
    enabled: enabled && !!plantId,
  });
