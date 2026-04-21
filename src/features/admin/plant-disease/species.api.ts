import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  SpeciesDto,
  SpeciesListParams,
  SpeciesCreatePayload,
  SpeciesUpdatePayload,
} from "./types";
import type { SpringPage } from "../types";

export const speciesApi = {
  listSpecies: (params: SpeciesListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<SpeciesDto>>>(
      API_ENDPOINTS.SPECIES.LIST,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "commonName",
          sortDir: params.sortDir ?? "ASC",
        },
      },
    ),

  getSpeciesById: (id: string) =>
    apiClient.get<ApiEnvelope<SpeciesDto>>(API_ENDPOINTS.SPECIES.ITEM(id)),

  createSpecies: (data: SpeciesCreatePayload) =>
    apiClient.post<ApiEnvelope<SpeciesDto>>(API_ENDPOINTS.SPECIES.CREATE, data),

  updateSpecies: (id: string, data: SpeciesUpdatePayload) =>
    apiClient.put<ApiEnvelope<SpeciesDto>>(
      API_ENDPOINTS.SPECIES.UPDATE(id),
      data,
    ),

  deleteSpecies: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.SPECIES.ITEM(id)),

  seedFromPerenual: (startPage: number, pages: number, perPage: number) =>
    apiClient.post<ApiEnvelope<{ created: number; skipped: number }>>(
      API_ENDPOINTS.SPECIES.SEED_PERENUAL,
      null,
      { params: { startPage, pages, perPage } },
    ),
};
