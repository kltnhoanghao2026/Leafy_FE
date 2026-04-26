import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { PageResponse, SpeciesResponse } from "../types";
import { unwrapApiData, unwrapPageContent } from "./apiUtils";

export const speciesApi = {
  getSpecies: async () => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<SpeciesResponse>> | PageResponse<SpeciesResponse>
    >(API_ENDPOINTS.SPECIES.LIST, {
      params: { page: 0, size: 100, sortBy: "commonName", sortDir: "ASC" },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getSpeciesById: async (speciesId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<SpeciesResponse> | SpeciesResponse
    >(API_ENDPOINTS.SPECIES.ITEM(speciesId));
    return unwrapApiData(response.data);
  },
};
