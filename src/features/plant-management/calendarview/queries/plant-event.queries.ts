import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import type { PlantEventsCalendarParams, PlantEventUpdateRequest, EventProgressUpdateRequest } from '../../shared/types';
import { plantManagementKeys } from '../../shared/queries/keys';

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



export const usePlantEventsByPlanApply = (planApplyId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plantEventsByPlanApply(planApplyId),
    queryFn: () => plantEventApi.getPlantEventsByPlanApply(planApplyId),
    enabled: enabled && !!planApplyId,
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
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.plantEvent(event.id), "progress"],
        }),
        // Invalidate ALL plantEvent detail queries so the full ancestor chain refreshes
        // (FARM → FARM_ZONE → PLANT hierarchy — toggling any level needs all ancestors to update)
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "detail"],
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

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, taskIndex }: { eventId: string; taskIndex: number }) =>
      plantEventApi.toggleTask(eventId, taskIndex),
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
  });
};

export const useEventProgress = (eventId: string, page = 0, enabled = true) =>
  useQuery({
    queryKey: [...plantManagementKeys.plantEvent(eventId), "progress", page],
    queryFn: () => plantEventApi.getEventProgress(eventId, page),
    enabled: enabled && !!eventId,
  });

export const useUpdateEventProgressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      progressId,
      payload,
    }: {
      eventId: string;
      progressId: string;
      payload: EventProgressUpdateRequest;
    }) => plantEventApi.updateEventProgress(eventId, progressId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.plantEvent(variables.eventId), "progress"],
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvent(variables.eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
      ]);
    },
  });
};

export const useGenerateEventProgressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => plantEventApi.generateEventProgress(eventId),
    onSuccess: async (_data, eventId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.plantEvent(eventId), "progress"],
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvent(eventId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
      ]);
    },
  });
};
