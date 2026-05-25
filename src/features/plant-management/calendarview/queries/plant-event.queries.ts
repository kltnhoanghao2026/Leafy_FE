import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantEventApi } from "../api/plant-event.api";
import type { PlantEventsCalendarParams, PlantEventUpdateRequest, PlantEventCreateRequest } from '../../shared/types';
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
    onMutate: async ({ eventId }) => {
      await queryClient.cancelQueries({
        queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
      });
      await queryClient.cancelQueries({
        queryKey: plantManagementKeys.plantEvent(eventId),
      });
      await queryClient.invalidateQueries({
        queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
      });
      await queryClient.invalidateQueries({
        queryKey: plantManagementKeys.plantEvent(eventId),
      });
    },
    onSuccess: async (event) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvent(event.id),
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
        event.planApplyId
          ? queryClient.invalidateQueries({
              queryKey: plantManagementKeys.plantEventsByPlanApply(event.planApplyId),
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

export const useDeletableChildren = (eventId: string) =>
  useQuery({
    queryKey: [...plantManagementKeys.plantEvent(eventId), "deletable-children"],
    queryFn: () => plantEventApi.getDeletableChildren(eventId),
    enabled: !!eventId,
  });

export const useDeleteWithChildrenMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, confirmDelete }: { eventId: string; confirmDelete: boolean }) =>
      plantEventApi.deleteWithChildren(eventId, confirmDelete),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
      ]);
    },
    meta: {
      successMessage: "Đã xóa lịch chăm sóc và các sự kiện con.",
    },
  });
};

export const useCreatePlantEventMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlantEventCreateRequest) =>
      plantEventApi.createPlantEvent(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
      ]);
    },
    meta: {
      successMessage: "Đã tạo lịch chăm sóc.",
    },
  });
};

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, taskIndex }: { eventId: string; taskIndex: number }) =>
      plantEventApi.toggleTask(eventId, taskIndex),
    onMutate: async ({ eventId }) => {
      await queryClient.cancelQueries({
        queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
      });
      await queryClient.cancelQueries({
        queryKey: plantManagementKeys.plantEvent(eventId),
      });
      await queryClient.invalidateQueries({
        queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
      });
      await queryClient.invalidateQueries({
        queryKey: plantManagementKeys.plantEvent(eventId),
      });
    },
    onSuccess: async (event) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvent(event.id),
        }),
        // Refresh ALL plant event detail queries so the parent event (and
        // grandparent, etc.) in PlantEventProgressModal re-fetches and updates
        // its liveChildMap / progress bars
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "detail"],
        }),
        event.plantId
          ? queryClient.invalidateQueries({
              queryKey: plantManagementKeys.plantEvents(event.plantId),
            })
          : Promise.resolve(),
        event.planApplyId
          ? queryClient.invalidateQueries({
              queryKey: plantManagementKeys.plantEventsByPlanApply(event.planApplyId),
            })
          : Promise.resolve(),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events", "calendar"],
        }),
      ]);
    },
  });
};
