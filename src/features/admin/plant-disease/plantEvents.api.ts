import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type { PlantEventDto, PlantEventListParams } from "./types";
import type { SpringPage } from "../types";

export const plantEventsApi = {
  listAllEvents: (params: PlantEventListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<PlantEventDto>>>(
      API_ENDPOINTS.PLANT_EVENTS.LIST_ALL,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "calculatedStartDate",
          sortDir: params.sortDir ?? "DESC",
          ...(params.eventType ? { eventType: params.eventType } : {}),
          ...(params.planned !== undefined ? { planned: params.planned } : {}),
          ...(params.farmPlotId ? { farmPlotId: params.farmPlotId } : {}),
          ...(params.farmZoneId ? { farmZoneId: params.farmZoneId } : {}),
        },
      },
    ),

  getEventById: (id: string) =>
    apiClient.get<ApiEnvelope<PlantEventDto>>(
      API_ENDPOINTS.PLANT_EVENTS.ITEM(id),
    ),

  deleteEvent: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.PLANT_EVENTS.ITEM(id)),
};
