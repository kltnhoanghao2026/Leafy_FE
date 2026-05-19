import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type {
  RagApiResponse,
  RagChatRequest,
  RagChatResult,
  RagConversation,
  RagHealthResponse,
  RagPlan,
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

  getRagPlans: async (
    params: { page?: number; size?: number } = {},
  ) => {
    const response = await apiClient.get<
      RagApiResponse<RagPlan[]> | RagPlan[]
    >(API_ENDPOINTS.RAG.TREATMENT_PLANS, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    });
    return unwrapRagResult(response.data).map(
      (plan) => normalizeTreatmentPlan(plan) ?? plan,
    );
  },

  getRagPlanById: async (planId: string) => {
    const response = await apiClient.get<
      RagApiResponse<RagPlan> | RagPlan
    >(API_ENDPOINTS.RAG.PLAN(planId));
    const plan = unwrapRagResult(response.data);
    return normalizeTreatmentPlan(plan) ?? plan;
  },

  getRagConversations: async (
    params: { page?: number; size?: number } = {},
  ) => {
    const response = await apiClient.get<
      RagApiResponse<RagConversation[]> | RagConversation[]
    >(API_ENDPOINTS.RAG.CONVERSATIONS, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    });
    return unwrapRagResult(response.data);
  },

  getRagConversationById: async (conversationId: string) => {
    const response = await apiClient.get<
      RagApiResponse<RagConversation> | RagConversation
    >(API_ENDPOINTS.RAG.CONVERSATION(conversationId));
    return unwrapRagResult(response.data);
  },

  renameRagConversation: async (conversationId: string, title: string) => {
    const response = await apiClient.patch<
      RagApiResponse<RagConversation> | RagConversation
    >(API_ENDPOINTS.RAG.CONVERSATION(conversationId), { title });
    return unwrapRagResult(response.data);
  },

  deleteRagConversation: async (conversationId: string) => {
    await apiClient.delete(API_ENDPOINTS.RAG.CONVERSATION(conversationId));
  },
};
