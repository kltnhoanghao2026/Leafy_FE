export const treatmentPlanKeys = {
  all: () => ["treatment-plans"] as const,
  list: (params: object) => ["treatment-plans", "list", params] as const,
  detail: (id: string) => ["treatment-plans", "detail", id] as const,
};
