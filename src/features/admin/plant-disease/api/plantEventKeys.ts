export const plantEventKeys = {
  all: () => ["plant-events"] as const,
  list: (params: object) => ["plant-events", "list", params] as const,
  detail: (id: string) => ["plant-events", "detail", id] as const,
};
