import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plantEventsApi } from "./plantEvents.api";
import { plantEventKeys } from "./plantEventKeys";
import type { PlantEventListParams } from "./types";

export const useAdminPlantEvents = (params: PlantEventListParams = {}) =>
  useQuery({
    queryKey: plantEventKeys.list(params),
    queryFn: () => plantEventsApi.listAllEvents(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const usePlantEvent = (id: string) =>
  useQuery({
    queryKey: plantEventKeys.detail(id),
    queryFn: () => plantEventsApi.getEventById(id),
    select: (res) => res.data.data,
    enabled: !!id,
    staleTime: 30_000,
  });

export const useDeletePlantEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plantEventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantEventKeys.all() });
    },
  });
};
