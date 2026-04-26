import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type {
  RagApiResponse,
  RagChatRequest,
  RagChatResult,
  RagHealthResponse,
  RagTreatmentPlan,
} from "../types";
import { normalizeTreatmentPlan, unwrapRagResult } from "../utils/ragResponse";

export const ragApi = {
  getRagHealth: async () => {
    const response = await apiClient.get<RagHealthResponse>(
      API_ENDPOINTS.RAG.HEALTH,
    );
    return response.data;
  },

  sendRagChat: async (payload: RagChatRequest) => {
    const response = await apiClient.post<
      RagApiResponse<RagChatResult> | RagChatResult
    >(API_ENDPOINTS.RAG.CHAT, payload);
    return unwrapRagResult(response.data);
  },

  getRagTreatmentPlans: async (
    params: { page?: number; size?: number } = {},
  ) => {
    const response = await apiClient.get<
      RagApiResponse<RagTreatmentPlan[]> | RagTreatmentPlan[]
    >(API_ENDPOINTS.RAG.TREATMENT_PLANS, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    });
    return unwrapRagResult(response.data).map(
      (plan) => normalizeTreatmentPlan(plan) ?? plan,
    );
  },

  getRagTreatmentPlanById: async (planId: string) => {
    const response = await apiClient.get<
      RagApiResponse<RagTreatmentPlan> | RagTreatmentPlan
    >(API_ENDPOINTS.RAG.TREATMENT_PLAN(planId));
    const plan = unwrapRagResult(response.data);
    return normalizeTreatmentPlan(plan) ?? plan;
  },
};
