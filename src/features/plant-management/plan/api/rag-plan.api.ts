import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";
import type { ApiEnvelope } from "../../../../shared/types/api";
import type { RagPlanListParams, RagPlanResponse } from "../../shared/types";

export const ragPlanApi = {
  getMyRagPlans: async (params: RagPlanListParams = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<RagPlanResponse[]>
    >(API_ENDPOINTS.RAG_PLANS.LIST, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    const data = response.data;
    if (data && typeof data === "object" && "result" in data) {
      return (data as ApiEnvelope<RagPlanResponse[]>).result ?? [];
    }
    return [];
  },

  getRagPlanById: async (planId: string) => {
    const response = await apiClient.get<ApiEnvelope<RagPlanResponse>>(
      API_ENDPOINTS.RAG_PLANS.ITEM(planId),
    );
    const data = response.data;
    if (data && typeof data === "object" && "result" in data) {
      return (data as ApiEnvelope<RagPlanResponse>).result ?? null;
    }
    return null;
  },
};
