import { useMutation, useQuery } from "@tanstack/react-query";
import { ragApi } from "../api/rag.api";
import type { RagChatRequest } from "../types";
import { ragAssistantKeys } from "./keys";

export const useRagHealth = () =>
  useQuery({
    queryKey: ragAssistantKeys.health(),
    queryFn: ragApi.getRagHealth,
    staleTime: 60_000,
  });

export const useSendRagChatMutation = () =>
  useMutation({
    mutationFn: (payload: RagChatRequest) => ragApi.sendRagChat(payload),
  });

export const useRagTreatmentPlans = (
  params: { page?: number; size?: number } = {},
) =>
  useQuery({
    queryKey: ragAssistantKeys.treatmentPlans(params),
    queryFn: () => ragApi.getRagTreatmentPlans(params),
  });

export const useRagTreatmentPlan = (planId: string | null) =>
  useQuery({
    queryKey: ragAssistantKeys.treatmentPlan(planId ?? ""),
    queryFn: () => ragApi.getRagTreatmentPlanById(planId ?? ""),
    enabled: Boolean(planId),
  });
