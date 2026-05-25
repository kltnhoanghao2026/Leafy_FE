import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { speciesApi } from "./species.api";
import { speciesKeys } from "./speciesKeys";
import type {
  SpeciesListParams,
  SpeciesCreatePayload,
  SpeciesUpdatePayload,
} from "../types";

export const useAdminSpecies = (params: SpeciesListParams = {}) =>
  useQuery({
    queryKey: speciesKeys.list(params),
    queryFn: () => speciesApi.listSpecies(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const useSpecies = (id: string) =>
  useQuery({
    queryKey: speciesKeys.detail(id),
    queryFn: () => speciesApi.getSpeciesById(id),
    select: (res) => res.data.data,
    enabled: !!id,
    staleTime: 30_000,
  });

export const useCreateSpecies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SpeciesCreatePayload) => speciesApi.createSpecies(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: speciesKeys.all() });
    },
  });
};

export const useUpdateSpecies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpeciesUpdatePayload }) =>
      speciesApi.updateSpecies(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: speciesKeys.all() });
      queryClient.invalidateQueries({ queryKey: speciesKeys.detail(id) });
    },
  });
};

export const useDeleteSpecies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => speciesApi.deleteSpecies(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: speciesKeys.all() });
    },
  });
};

export const useSeedSpeciesFromPerenual = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      startPage,
      pages,
      perPage,
    }: {
      startPage: number;
      pages: number;
      perPage: number;
    }) => speciesApi.seedFromPerenual(startPage, pages, perPage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: speciesKeys.all() });
    },
  });
};
