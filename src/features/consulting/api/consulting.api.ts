import apiClient from '../../../lib/apiClient';
import { API_ENDPOINTS } from '../../../lib/routes';
import type { ApiEnvelope } from '../../../shared/types/api';
import type { FarmPlotResponse, FarmZoneResponse } from '../../farm-management/types';
import type {
  PageResponse,
  PlantEventCreateRequest,
  PlantEventResponse,
  PlantResponse,
  PlanCreateRequest,
  PlanResponse,
} from '../../plant-management/shared/types';
import { unwrapApiData, unwrapPageContent } from '../../plant-management/shared/api/apiUtils';

const defaultPageParams = {
  page: 0,
  size: 100,
  sortBy: 'createdAt',
  sortDir: 'DESC',
};

export const consultingApi = {
  getConsultingFarmPlots: async (farmerProfileId: string): Promise<FarmPlotResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<FarmPlotResponse[]> | FarmPlotResponse[]
    >(API_ENDPOINTS.CONSULTING.FARM_PLOTS, {
      params: { farmerProfileId },
    });
    return unwrapApiData(response.data);
  },

  getConsultingFarmPlot: async (farmPlotId: string): Promise<FarmPlotResponse> => {
    const response = await apiClient.get<
      ApiEnvelope<FarmPlotResponse> | FarmPlotResponse
    >(API_ENDPOINTS.CONSULTING.FARM_PLOT(farmPlotId));
    return unwrapApiData(response.data);
  },

  getConsultingFarmZones: async (farmPlotId: string): Promise<FarmZoneResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<FarmZoneResponse[]> | FarmZoneResponse[]
    >(API_ENDPOINTS.CONSULTING.FARM_ZONES(farmPlotId));
    return unwrapApiData(response.data);
  },

  getConsultingPlants: async (farmerProfileId: string): Promise<PlantResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantResponse>> | PageResponse<PlantResponse>
    >(API_ENDPOINTS.CONSULTING.PLANTS, {
      params: { ...defaultPageParams, farmerProfileId },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getConsultingPlantById: async (plantId: string): Promise<PlantResponse> => {
    const response = await apiClient.get<
      ApiEnvelope<PlantResponse> | PlantResponse
    >(API_ENDPOINTS.CONSULTING.PLANT(plantId));
    return unwrapApiData(response.data);
  },

  getConsultingPlantEvents: async (
    farmerProfileId: string,
    plantId: string,
  ): Promise<PlantEventResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlantEventResponse>> | PageResponse<PlantEventResponse>
    >(API_ENDPOINTS.CONSULTING.PLANT_EVENTS, {
      params: { ...defaultPageParams, farmerProfileId, plantId },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  createConsultingPlantEvent: async (
    farmerProfileId: string,
    payload: PlantEventCreateRequest,
  ): Promise<PlantEventResponse> => {
    const response = await apiClient.post<
      ApiEnvelope<PlantEventResponse> | PlantEventResponse
    >(API_ENDPOINTS.CONSULTING.PLANT_EVENTS, payload, {
      params: { farmerProfileId },
    });
    return unwrapApiData(response.data);
  },

  getConsultingPlans: async (farmerProfileId: string): Promise<PlanResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<PlanResponse>> | PageResponse<PlanResponse>
    >(API_ENDPOINTS.CONSULTING.PLANS, {
      params: { ...defaultPageParams, farmerProfileId },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  createConsultingPlan: async (
    farmerProfileId: string,
    payload: PlanCreateRequest,
  ): Promise<PlanResponse> => {
    const response = await apiClient.post<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.CONSULTING.PLANS, payload, {
      params: { farmerProfileId },
    });
    return unwrapApiData(response.data);
  },

  getBulkConsultingSummary: async (
    farmerProfileIds: string[],
  ): Promise<Record<string, { plotCount: number; zoneCount: number; plantCount: number }>> => {
    const response = await apiClient.post<
      | ApiEnvelope<Record<string, { plotCount: number; zoneCount: number; plantCount: number }>>
      | Record<string, { plotCount: number; zoneCount: number; plantCount: number }>
    >(API_ENDPOINTS.CONSULTING.FARMER_SUMMARY_BULK, { farmerProfileIds });
    return unwrapApiData(response.data);
  },

  getConsultingCalendar: async (farmerProfileId: string, startDate: string, endDate: string): Promise<PlantEventResponse[]> => {
    const response = await apiClient.get<
      ApiEnvelope<PlantEventResponse[]> | PlantEventResponse[]
    >(API_ENDPOINTS.CONSULTING.CALENDAR, {
      params: { farmerProfileId, startDate, endDate },
    });
    return unwrapApiData(response.data);
  },
};
