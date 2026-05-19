export const ragAssistantKeys = {
  all: ["rag-assistant"] as const,
  health: () => [...ragAssistantKeys.all, "health"] as const,
  plans: (params?: { page?: number; size?: number }) =>
    [...ragAssistantKeys.all, "plans", params ?? {}] as const,
  plan: (planId: string) =>
    [...ragAssistantKeys.all, "plan", planId] as const,
  conversations: (params?: { page?: number; size?: number }) =>
    [...ragAssistantKeys.all, "conversations", params ?? {}] as const,
  conversation: (id: string) =>
    [...ragAssistantKeys.all, "conversation", id] as const,
};
