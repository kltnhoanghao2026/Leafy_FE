import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import type { PlantEventsCalendarParams, PlantEventUpdateRequest } from "../types";
import { plantManagementKeys } from "./keys";

export const usePlantEvent = (eventId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantEvent(eventId),
    queryFn: () => plantEventApi.getPlantEventById(eventId),
    enabled: enabled && !!eventId,
  });

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

export const usePlantEventsByPlan = (sourcePlanId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantEventsByPlan(sourcePlanId),
    queryFn: () => plantEventApi.getPlantEventsByPlan(sourcePlanId),
    enabled: enabled && !!sourcePlanId,
  });

export const usePlantEventsCalendar = (params: PlantEventsCalendarParams) =>
  useQuery({
    queryKey: plantManagementKeys.plantEventsCalendar(params),
    queryFn: () => plantEventApi.getPlantEventsCalendar(params),
    enabled: Boolean(params.startDate && params.endDate),
  });

export const useUpdatePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: PlantEventUpdateRequest;
    }) => plantEventApi.updatePlantEvent(eventId, payload),
    onSuccess: async (event) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvent(event.id),
        }),
        event.plantId
          ? queryClient.invalidateQueries({
              queryKey: plantManagementKeys.plantEvents(event.plantId),
            })
          : Promise.resolve(),
        event.sourcePlanId
          ? queryClient.invalidateQueries({
              queryKey: plantManagementKeys.plantEventsByPlan(event.sourcePlanId),
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
      ]);
    },
    meta: {
      successMessage: "Đã cập nhật lịch chăm sóc.",
    },
  });
};

export const useDeletePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => plantEventApi.deletePlantEvent(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...plantManagementKeys.all(), "plant-events"],
      });
    },
    meta: {
      successMessage: "Đã xóa lịch chăm sóc.",
    },
  });
};
