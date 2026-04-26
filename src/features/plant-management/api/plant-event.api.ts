import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  PageResponse,
  PlantEventResponse,
  PlantEventsCalendarParams,
  PlantEventUpdateRequest,
} from "../types";
import { unwrapApiData, unwrapPageContent } from "./apiUtils";

const eventPageParams = {
  page: 0,
  size: 100,
  sortBy: "calculatedStartDate",
  sortDir: "ASC",
};

const getPagedEvents = async (url: string) => {
  const response = await apiClient.get<
    ApiEnvelope<PageResponse<PlantEventResponse>> | PageResponse<PlantEventResponse>
  >(url, { params: eventPageParams });
  return unwrapPageContent(unwrapApiData(response.data));
};

export const plantEventApi = {
  getPlantEventById: async (eventId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PlantEventResponse> | PlantEventResponse
    >(API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId));
    return unwrapApiData(response.data);
  },

  getPlantEvents: async (plantId: string) =>
    getPagedEvents(API_ENDPOINTS.PLANT_EVENTS.BY_PLANT(plantId)),

  getPlannedPlantEvents: async (plantId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantEventResponse>> | PageResponse<PlantEventResponse>
    >(API_ENDPOINTS.PLANT_EVENTS.BY_PLANT_PLANNED(plantId), {
      params: { ...eventPageParams, isPlanned: true },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getPlantEventsByPlan: async (sourcePlanId: string) =>
    getPagedEvents(API_ENDPOINTS.PLANT_EVENTS.BY_PLAN(sourcePlanId)),

  getPlantEventsByFarmPlot: async (farmPlotId: string) =>
    getPagedEvents(API_ENDPOINTS.PLANT_EVENTS.BY_FARM_PLOT(farmPlotId)),

  getPlantEventsByFarmZone: async (farmZoneId: string) =>
    getPagedEvents(API_ENDPOINTS.PLANT_EVENTS.BY_FARM_ZONE(farmZoneId)),

  getPlantEventsCalendar: async (params: PlantEventsCalendarParams) => {
    const response = await apiClient.get<
      ApiEnvelope<PlantEventResponse[]> | PlantEventResponse[]
    >(API_ENDPOINTS.PLANT_EVENTS.CALENDAR, { params });
    return unwrapApiData(response.data);
  },

  updatePlantEvent: async (
    eventId: string,
    payload: PlantEventUpdateRequest,
  ) => {
    const response = await apiClient.put<
      ApiEnvelope<PlantEventResponse> | PlantEventResponse
    >(API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId), payload);
    return unwrapApiData(response.data);
  },

  deletePlantEvent: async (eventId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.PLANT_EVENTS.ITEM(eventId),
    );
  },
};
