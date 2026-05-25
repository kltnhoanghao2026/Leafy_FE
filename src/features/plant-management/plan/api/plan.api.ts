import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";
import type { ApiEnvelope } from "../../../../shared/types/api";
import type {
  PageResponse,
  BulkOperationResult,
  BulkApplyCustomRequest,
  BulkPlanDeleteRequest,
  BulkPlanStatusUpdateRequest,
  MyAppliesParams,
  PlanApplyRequest,
  PlanApplyResponse,
  PlanCreateRequest,
  PlanUpdateRequest,
  PlanListParams,
  PublicPlanListParams,
  PlanResponse,
  TreatmentStatus,
  ApplyToAllFarmsRequest,
} from "../../shared/types";
import { unwrapApiData, unwrapPageContent, toPageResponse } from "../../shared/api/apiUtils";

const defaultParams = {
  sortBy: "createdAt",
  sortDir: "DESC",
};

const pageParams = {
  ...defaultParams,
  size: 100,
};

export const treatmentPlanApi = {
  getMyTreatmentPlans: async (params: PlanListParams = {}) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.PLANS.MY, {
      params: {
        ...defaultParams,
        ...params,
        plantId: params.plantId || undefined,
        search: params.search || undefined,
        sourceType: params.sourceType || undefined,
      },
    });
    return toPageResponse(unwrapApiData(response.data));
  },

  getPublicPlans: async (params: PublicPlanListParams = {}) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanResponse>>
      | PageResponse<PlanResponse>
    >(API_ENDPOINTS.SEARCH.PLANS, {
      params: {
        ...defaultParams,
        ...params,
        search: params.search || undefined,
        sourceType: params.sourceType || undefined,
        severityLevel: params.severityLevel || undefined,
        urgency: params.urgency || undefined,
      },
    });
    return toPageResponse(unwrapApiData(response.data));
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

  togglePlanVisibility: async (planId: string) => {
    const response = await apiClient.put<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.PLANS.ITEM(planId) + "/visibility/toggle");
    return unwrapApiData(response.data);
  },

  updatePlan: async (planId: string, payload: PlanUpdateRequest) => {
    const response = await apiClient.put<
      ApiEnvelope<PlanResponse> | PlanResponse
    >(API_ENDPOINTS.PLANS.ITEM(planId), payload);
    return unwrapApiData(response.data);
  },

  deletePlan: async (planId: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.PLANS.ITEM(planId),
    );
  },

  // ── PlanApply operations ────────────────────────────────────────────────

  applyPlan: async (planId: string, payload: PlanApplyRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.APPLY(planId), payload);
    return unwrapApiData(response.data);
  },

  applyPlanToAllFarms: async (planId: string, payload: ApplyToAllFarmsRequest) => {
    const response = await apiClient.post<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.APPLY_TO_ALL_FARMS(planId), payload);
    return unwrapApiData(response.data);
  },

  getAppliesByPlan: async (planId: string) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanApplyResponse>>
      | PageResponse<PlanApplyResponse>
    >(API_ENDPOINTS.PLANS.APPLIES(planId), {
      params: { ...defaultParams, size: 100 },
    });
    return toPageResponse(unwrapApiData(response.data));
  },

  getApplyById: async (applyId: string) => {
    const response = await apiClient.get<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.APPLY_ITEM(applyId));
    return unwrapApiData(response.data);
  },

  getMyApplies: async (params: MyAppliesParams = {}) => {
    const response = await apiClient.get<
      | ApiEnvelope<PageResponse<PlanApplyResponse>>
      | PageResponse<PlanApplyResponse>
    >(API_ENDPOINTS.PLANS.MY_APPLIES, {
      params: {
        ...defaultParams,
        ...params,
        status: params.status || undefined,
      },
    });
    return toPageResponse(unwrapApiData(response.data));
  },

  updateApplyStatus: async (applyId: string, status: TreatmentStatus) => {
    const response = await apiClient.patch<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.APPLY_STATUS(applyId), null, {
      params: { status },
    });
    return unwrapApiData(response.data);
  },

  cancelApply: async (applyId: string) => {
    const response = await apiClient.post<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.CANCEL_APPLY(applyId));
    return unwrapApiData(response.data);
  },

  completeApply: async (applyId: string, success: boolean) => {
    const response = await apiClient.patch<
      ApiEnvelope<PlanApplyResponse> | PlanApplyResponse
    >(API_ENDPOINTS.PLANS.COMPLETE_APPLY(applyId), { success });
    return unwrapApiData(response.data);
  },

  bulkUpdateApplyStatus: async (
    payload: BulkPlanStatusUpdateRequest,
  ): Promise<BulkOperationResult> => {
    const response = await apiClient.patch<
      ApiEnvelope<BulkOperationResult> | BulkOperationResult
    >(API_ENDPOINTS.PLANS.BULK_APPLY_STATUS, payload);
    return unwrapApiData(response.data) as BulkOperationResult;
  },

  bulkDeletePlans: async (
    payload: BulkPlanDeleteRequest,
  ): Promise<BulkOperationResult> => {
    const response = await apiClient.delete<
      ApiEnvelope<BulkOperationResult> | BulkOperationResult
    >(API_ENDPOINTS.PLANS.BULK_DELETE, { data: payload });
    return unwrapApiData(response.data) as BulkOperationResult;
  },

  bulkApplyCustom: async (
    payload: BulkApplyCustomRequest,
  ): Promise<BulkOperationResult> => {
    const response = await apiClient.post<
      ApiEnvelope<BulkOperationResult> | BulkOperationResult
    >(API_ENDPOINTS.PLANS.BULK_APPLY_CUSTOM, payload);
    return unwrapApiData(response.data) as BulkOperationResult;
  },
};

export interface ChunkDetail {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  point_id: string | null;
  text: string;
  metadata: Record<string, unknown>;
}

export const ragApi = {
  getChunksByPointIds: async (pointIds: string[]): Promise<ChunkDetail[]> => {
    const params = pointIds.map((id) => `point_ids=${encodeURIComponent(id)}`).join("&");
    const response = await apiClient.get<ApiEnvelope<ChunkDetail[]> | ChunkDetail[]>(
      API_ENDPOINTS.RAG.CHUNKS_BY_POINT_IDS,
      { params },
    );
    const data = response.data;
    if (data && typeof data === "object" && "data" in data) {
      return (data as ApiEnvelope<ChunkDetail[]>).data ?? [];
    }
    return (data as ChunkDetail[]) ?? [];
  },
};
