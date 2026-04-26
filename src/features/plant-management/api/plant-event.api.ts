import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { PageResponse, PlantEventResponse } from "../types";
import { unwrapApiData, unwrapPageContent } from "./apiUtils";

const eventPageParams = {
  page: 0,
  size: 100,
  sortBy: "calculatedStartDate",
  sortDir: "ASC",
};

export const plantEventApi = {
  getPlantEvents: async (plantId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantEventResponse>> | PageResponse<PlantEventResponse>
    >(API_ENDPOINTS.PLANT_EVENTS.BY_PLANT(plantId), {
      params: eventPageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getPlannedPlantEvents: async (plantId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantEventResponse>> | PageResponse<PlantEventResponse>
    >(API_ENDPOINTS.PLANT_EVENTS.BY_PLANT_PLANNED(plantId), {
      params: { ...eventPageParams, isPlanned: true },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },
};
