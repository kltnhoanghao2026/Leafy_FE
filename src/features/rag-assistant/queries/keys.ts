export const ragAssistantKeys = {
  all: ["rag-assistant"] as const,
  health: () => [...ragAssistantKeys.all, "health"] as const,
  treatmentPlans: (params?: { page?: number; size?: number }) =>
    [...ragAssistantKeys.all, "treatment-plans", params ?? {}] as const,
  treatmentPlan: (planId: string) =>
    [...ragAssistantKeys.all, "treatment-plan", planId] as const,
};
