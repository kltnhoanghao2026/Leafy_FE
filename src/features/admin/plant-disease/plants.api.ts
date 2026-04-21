import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { PlantDto, PlantListParams } from "./types";
import type { SpringPage } from "../types";

export const plantsApi = {
  listPlants: (params: PlantListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<PlantDto>>>(
      API_ENDPOINTS.PLANTS.LIST,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
          ...(params.status ? { status: params.status } : {}),
        },
      },
    ),

  getPlantById: (id: string) =>
    apiClient.get<ApiEnvelope<PlantDto>>(API_ENDPOINTS.PLANTS.ITEM(id)),

  deletePlant: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.PLANTS.ITEM(id)),

  getPlantsByFarmPlot: (farmPlotId: string, size = 50) =>
    apiClient.get<ApiEnvelope<SpringPage<PlantDto>>>(
      API_ENDPOINTS.PLANTS.BY_FARM_PLOT(farmPlotId),
      { params: { page: 0, size } },
    ),
};
