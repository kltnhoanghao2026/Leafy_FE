import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";
import type { ApiEnvelope } from "../../../../shared/types/api";
import type {
  PlanDto,
  PlanListParams,
  TreatmentStatus,
} from "../types";
import type { SpringPage } from "../types";

export const plansApi = {
  listAllPlans: (params: PlanListParams = {}) =>
    apiClient.get<ApiEnvelope<SpringPage<PlanDto>>>(
      API_ENDPOINTS.PLANS.LIST,
      {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? "createdAt",
          sortDir: params.sortDir ?? "DESC",
          ...(params.status ? { status: params.status } : {}),
        },
      },
    ),

  updatePlanStatus: (planId: string, status: TreatmentStatus) =>
    apiClient.patch<ApiEnvelope<PlanDto>>(
      API_ENDPOINTS.PLANS.UPDATE_STATUS(planId),
      null,
      { params: { status } },
    ),

  deletePlan: (id: string) =>
    apiClient.delete<ApiEnvelope<void>>(API_ENDPOINTS.PLANS.ITEM(id)),
};
