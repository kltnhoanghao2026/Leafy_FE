export const planKeys = {
  all: () => ["plans"] as const,
  list: (params: object) => ["plans", "list", params] as const,
  detail: (id: string) => ["plans", "detail", id] as const,
};
