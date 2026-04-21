import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  FarmPlotDto,
  FarmZoneDto,
  FarmPlotListParams,
  FarmZoneListParams,
  SpringPage,
} from "../types";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const farmsApi = {
  /** Admin: get farm plots with filters + pagination */
  listPlots: (params: FarmPlotListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<FarmPlotDto>>>(
      API_ENDPOINTS.FARMS.ADMIN_PLOTS,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
          searchTerm: params.searchTerm || undefined,
          status: params.status || undefined,
          provinceCode: params.provinceCode || undefined,
          minAreaM2: params.minAreaM2 ?? undefined,
          maxAreaM2: params.maxAreaM2 ?? undefined,
        },
      },
    ),

  /** Admin: get farm zones with filters + pagination */
  listZones: (params: FarmZoneListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<FarmZoneDto>>>(
      API_ENDPOINTS.FARMS.ADMIN_ZONES,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
          searchTerm: params.searchTerm || undefined,
          status: params.status || undefined,
          cropType: params.cropType || undefined,
          soilType: params.soilType || undefined,
          minAreaM2: params.minAreaM2 ?? undefined,
          maxAreaM2: params.maxAreaM2 ?? undefined,
        },
      },
    ),

  /** Get zones for a specific farm plot */
  getPlotZones: (plotId: string) =>
    apiClient.get<ApiEnvelope<FarmZoneDto[]>>(
      API_ENDPOINTS.FARMS.PLOT_ZONES(plotId),
    ),

  /** Get a single farm plot by id */
  getPlot: (id: string) =>
    apiClient.get<ApiEnvelope<FarmPlotDto>>(API_ENDPOINTS.FARMS.PLOT(id)),

  /** Delete (soft-delete) a farm plot */
  deletePlot: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.FARMS.PLOT(id)),

  /** Get a single farm zone by id */
  getZone: (id: string) =>
    apiClient.get<ApiEnvelope<FarmZoneDto>>(API_ENDPOINTS.FARMS.ZONE(id)),

  /** Delete (soft-delete) a farm zone */
  deleteZone: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.FARMS.ZONE(id)),

  /** Get all farm plots owned by a specific profile */
  getPlotsByOwner: (ownerProfileId: string) =>
    apiClient.get<ApiEnvelope<FarmPlotDto[]>>(API_ENDPOINTS.FARMS.PLOTS, {
      params: { ownerProfileId },
    }),
};
