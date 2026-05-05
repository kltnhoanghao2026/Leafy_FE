export const ragAssistantKeys = {
  all: ["rag-assistant"] as const,
  health: () => [...ragAssistantKeys.all, "health"] as const,
  plans: (params?: { page?: number; size?: number }) =>
    [...ragAssistantKeys.all, "plans", params ?? {}] as const,
  plan: (planId: string) =>
    [...ragAssistantKeys.all, "plan", planId] as const,
};
