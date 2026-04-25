import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  CreateFarmPlotRequest,
  CreateFarmZoneRequest,
  FarmPlotResponse,
  FarmZoneResponse,
  UpdateFarmPlotRequest,
  UpdateFarmZoneRequest,
} from "../types";

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

export const farmApi = {
  getPlotsByOwner: async (ownerProfileId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<FarmPlotResponse[]> | FarmPlotResponse[]
    >(API_ENDPOINTS.FARMS.PLOTS, { params: { ownerProfileId } });
    return unwrapApiData(response.data);
  },

  createPlot: async (payload: CreateFarmPlotRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<FarmPlotResponse> | FarmPlotResponse
    >(API_ENDPOINTS.FARMS.PLOTS, payload);
    return unwrapApiData(response.data);
  },

  updatePlot: async (plotId: string, payload: UpdateFarmPlotRequest) => {
    const response = await apiClient.put<
      ApiEnvelope<FarmPlotResponse> | FarmPlotResponse
    >(API_ENDPOINTS.FARMS.PLOT(plotId), payload);
    return unwrapApiData(response.data);
  },

  deletePlot: async (plotId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(API_ENDPOINTS.FARMS.PLOT(plotId));
  },

  getZonesByPlot: async (plotId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<FarmZoneResponse[]> | FarmZoneResponse[]
    >(API_ENDPOINTS.FARMS.PLOT_ZONES(plotId));
    return unwrapApiData(response.data);
  },

  createZone: async (plotId: string, payload: CreateFarmZoneRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<FarmZoneResponse> | FarmZoneResponse
    >(API_ENDPOINTS.FARMS.PLOT_ZONES(plotId), payload);
    return unwrapApiData(response.data);
  },

  updateZone: async (zoneId: string, payload: UpdateFarmZoneRequest) => {
    const response = await apiClient.put<
      ApiEnvelope<FarmZoneResponse> | FarmZoneResponse
    >(API_ENDPOINTS.FARMS.ZONE(zoneId), payload);
    return unwrapApiData(response.data);
  },

  deleteZone: async (zoneId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(API_ENDPOINTS.FARMS.ZONE(zoneId));
  },
};
