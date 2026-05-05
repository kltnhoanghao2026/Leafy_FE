export const speciesKeys = {
  all: () => ["species"] as const,
  list: (params: object) => ["species", "list", params] as const,
  detail: (id: string) => ["species", "detail", id] as const,
};
