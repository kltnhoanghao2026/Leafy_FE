export const profileKeys = {
  all: () => ["profiles"] as const,
  me: () => [...profileKeys.all(), "me"] as const,
  detail: (userId: string) => [...profileKeys.all(), "detail", userId] as const,
};
