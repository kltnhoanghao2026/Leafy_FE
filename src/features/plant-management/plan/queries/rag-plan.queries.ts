import { useQuery } from "@tanstack/react-query";
import { ragPlanApi } from "../api/rag-plan.api";
import type { RagPlanListParams } from "../../shared/types";
import { plantManagementKeys } from "../../shared/queries/keys";

export const ragPlanKeys = {
  all: () => ["rag-plans"] as const,
  root: () => [...ragPlanKeys.all(), "list"] as const,
  myPlans: (params?: RagPlanListParams) =>
    [...ragPlanKeys.root(), params ?? {}] as const,
  plan: (planId: string) =>
    [...ragPlanKeys.all(), "detail", planId] as const,
};

export const useRagPlans = (params: RagPlanListParams = {}) =>
  useQuery({
    queryKey: ragPlanKeys.myPlans(params),
    queryFn: () => ragPlanApi.getMyRagPlans(params),
  });

export const useRagPlan = (planId: string, enabled = true) =>
  useQuery({
    queryKey: ragPlanKeys.plan(planId),
    queryFn: () => ragPlanApi.getRagPlanById(planId),
    enabled: enabled && !!planId,
  });
