import { useQuery } from "@tanstack/react-query";
import { speciesApi } from "../api/species.api";
import { plantManagementKeys } from "./keys";

export const useSpecies = () =>
  useQuery({
    queryKey: plantManagementKeys.species(),
    queryFn: speciesApi.getSpecies,
    staleTime: 1000 * 60 * 30,
  });

export const useSpeciesById = (speciesId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.speciesDetail(speciesId),
    queryFn: () => speciesApi.getSpeciesById(speciesId),
    enabled: enabled && !!speciesId,
    staleTime: 1000 * 60 * 30,
  });
