import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ragApi } from "../api/rag.api";
import type { RagChatRequest } from "../types";
import { ragAssistantKeys } from "./keys";

export const useRagHealth = () =>
  useQuery({
    queryKey: ragAssistantKeys.health(),
    queryFn: ragApi.getRagHealth,
    staleTime: 60_000,
  });

export const useSendRagChatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RagChatRequest) => ragApi.sendRagChat(payload),
    onSuccess: async (result) => {
      if (result.plan || result.plan || result.plan) {
        await queryClient.invalidateQueries({
          queryKey: [...ragAssistantKeys.all, "plans"],
        });
      }
    },
  });
};

export const useRagPlans = (
  params: { page?: number; size?: number } = {},
) =>
  useQuery({
    queryKey: ragAssistantKeys.plans(params),
    queryFn: () => ragApi.getRagPlans(params),
  });

export const useRagPlan = (planId: string | null) =>
  useQuery({
    queryKey: ragAssistantKeys.plan(planId ?? ""),
    queryFn: () => ragApi.getRagPlanById(planId ?? ""),
    enabled: Boolean(planId),
  });
