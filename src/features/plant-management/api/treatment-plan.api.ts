import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  PageResponse,
  TreatmentPlanCreateRequest,
  TreatmentPlanListParams,
  TreatmentPlanResponse,
  TreatmentStatus,
} from "../types";
import { unwrapApiData, unwrapPageContent } from "./apiUtils";

const pageParams = {
  page: 0,
  size: 100,
  sortBy: "createdAt",
  sortDir: "DESC",
};

export const treatmentPlanApi = {
  getMyTreatmentPlans: async (params: TreatmentPlanListParams = {}) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<TreatmentPlanResponse>>
      | PageResponse<TreatmentPlanResponse>
    >(API_ENDPOINTS.TREATMENT_PLANS.MY, {
      params: {
        ...pageParams,
        ...params,
        status: params.status || undefined,
      },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  createTreatmentPlan: async (payload: TreatmentPlanCreateRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<TreatmentPlanResponse> | TreatmentPlanResponse
    >(API_ENDPOINTS.TREATMENT_PLANS.CREATE, payload);
    return unwrapApiData(response.data);
  },

  getTreatmentPlanById: async (planId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<TreatmentPlanResponse> | TreatmentPlanResponse
    >(API_ENDPOINTS.TREATMENT_PLANS.ITEM(planId));
    return unwrapApiData(response.data);
  },

  getTreatmentPlansByPlant: async (plantId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<TreatmentPlanResponse>>
      | PageResponse<TreatmentPlanResponse>
    >(API_ENDPOINTS.TREATMENT_PLANS.BY_PLANT(plantId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getTreatmentPlansByFarmPlot: async (farmPlotId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<TreatmentPlanResponse>>
      | PageResponse<TreatmentPlanResponse>
    >(API_ENDPOINTS.TREATMENT_PLANS.BY_FARM_PLOT(farmPlotId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getTreatmentPlansByFarmZone: async (farmZoneId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<TreatmentPlanResponse>>
      | PageResponse<TreatmentPlanResponse>
    >(API_ENDPOINTS.TREATMENT_PLANS.BY_FARM_ZONE(farmZoneId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  updateTreatmentPlanStatus: async (
    planId: string,
    status: TreatmentStatus,
  ) => {
    const response = await apiClient.patch<
      ApiEnvelope<TreatmentPlanResponse> | TreatmentPlanResponse
    >(API_ENDPOINTS.TREATMENT_PLANS.ITEM(planId) + "/status", null, {
      params: { status },
    });
    return unwrapApiData(response.data);
  },

  deleteTreatmentPlan: async (planId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.TREATMENT_PLANS.ITEM(planId),
    );
  },
};
