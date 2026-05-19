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

export const useRagConversations = (
  params: { page?: number; size?: number } = {},
) =>
  useQuery({
    queryKey: ragAssistantKeys.conversations(params),
    queryFn: () => ragApi.getRagConversations(params),
  });

export const useRagConversation = (conversationId: string | null) =>
  useQuery({
    queryKey: ragAssistantKeys.conversation(conversationId ?? ""),
    queryFn: () => ragApi.getRagConversationById(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });

export const useRenameRagConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      title,
    }: {
      conversationId: string;
      title: string;
    }) => ragApi.renameRagConversation(conversationId, title),
    onSuccess: async (_, { conversationId }) => {
      await queryClient.invalidateQueries({
        queryKey: ragAssistantKeys.conversations(),
      });
      await queryClient.invalidateQueries({
        queryKey: ragAssistantKeys.conversation(conversationId),
      });
    },
  });
};

export const useDeleteRagConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      ragApi.deleteRagConversation(conversationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ragAssistantKeys.conversations(),
      });
    },
  });
};
