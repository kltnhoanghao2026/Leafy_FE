import apiClient from '../../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../../lib/routes';
import type { ApiEnvelope } from '../../../../shared/types/api';
import type {
  PageResponse,
  PlantCreateRequest,
  PlantResponse,
  PlantUpdateRequest,
} from '../../shared/types';
import { unwrapApiData, unwrapPageContent } from '../../shared/api/apiUtils';

const defaultPageParams = {
  page: 0,
  size: 100,
  sortBy: "createdAt",
  sortDir: "DESC",
};

export const plantApi = {
  getPlants: async () => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantResponse>> | PageResponse<PlantResponse>
    >(API_ENDPOINTS.PLANTS.LIST, { params: defaultPageParams });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getMyPlants: async (params: import('../../shared/types').PlantListParams = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantResponse>> | PageResponse<PlantResponse>
    >(API_ENDPOINTS.PLANTS.LIST + "/me", {
      params: {
        ...defaultPageParams,
        ...params,
        status: params.status || undefined,
        farmPlotId: params.farmPlotId || undefined,
        farmZoneId: params.farmZoneId || undefined,
        speciesId: params.speciesId || undefined,
        search: params.search || undefined,
      },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getPlantById: async (plantId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PlantResponse> | PlantResponse
    >(API_ENDPOINTS.PLANTS.ITEM(plantId));
    return unwrapApiData(response.data);
  },

  getPlantsByFarmPlot: async (farmPlotId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantResponse>> | PageResponse<PlantResponse>
    >(API_ENDPOINTS.PLANTS.BY_FARM_PLOT(farmPlotId), {
      params: defaultPageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getPlantsBySpecies: async (speciesId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantResponse>> | PageResponse<PlantResponse>
    >(API_ENDPOINTS.PLANTS.BY_SPECIES(speciesId), {
      params: defaultPageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  createPlant: async (payload: PlantCreateRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<PlantResponse> | PlantResponse
    >(API_ENDPOINTS.PLANTS.LIST, payload);
    return unwrapApiData(response.data);
  },

  updatePlant: async (plantId: string, payload: PlantUpdateRequest) => {
    const response = await apiClient.put<
      ApiEnvelope<PlantResponse> | PlantResponse
    >(API_ENDPOINTS.PLANTS.ITEM(plantId), payload);
    return unwrapApiData(response.data);
  },

  deletePlant: async (plantId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.PLANTS.ITEM(plantId),
    );
  },
};
