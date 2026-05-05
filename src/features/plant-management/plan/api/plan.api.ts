import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";
import type { ApiEnvelope } from "../../../../shared/types/api";
import type {
  PageResponse,
  PlanCreateRequest,
  PlanListParams,
  PlanResponse,
  TreatmentStatus,
} from "../../shared/types";
import { unwrapApiData, unwrapPageContent } from "../../shared/api/apiUtils";

const pageParams = {
  page: 0,
  size: 100,
  sortBy: "createdAt",
  sortDir: "DESC",
};

export const treatmentPlanApi = {
  getMyTreatmentPlans: async (params: PlanListParams = {}) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.PLANS.MY, {
      params: {
        ...pageParams,
        ...params,
        status: params.status || undefined,
      },
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  createPlan: async (payload: PlanCreateRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.PLANS.CREATE, payload);
    return unwrapApiData(response.data);
  },

  getTreatmentPlanById: async (planId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.PLANS.ITEM(planId));
    return unwrapApiData(response.data);
  },

  getTreatmentPlansByPlant: async (plantId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.PLANS.BY_PLANT(plantId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getTreatmentPlansByFarmPlot: async (farmPlotId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.PLANS.BY_FARM_PLOT(farmPlotId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  getTreatmentPlansByFarmZone: async (farmZoneId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.PLANS.BY_FARM_ZONE(farmZoneId), {
      params: pageParams,
    });
    return unwrapPageContent(unwrapApiData(response.data));
  },

  updateTreatmentPlanStatus: async (
    planId: string,
    status: TreatmentStatus,
  ) => {
    const response = await apiClient.patch<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.PLANS.ITEM(planId) + "/status", null, {
      params: { status },
    });
    return unwrapApiData(response.data);
  },

  deletePlan: async (planId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.PLANS.ITEM(planId),
    );
  },
};
