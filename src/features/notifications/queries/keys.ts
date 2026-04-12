export const pushKeys = {
  all: () => ["push-tokens"] as const,
  register: () => [...pushKeys.all(), "register"] as const,
  deactivate: () => [...pushKeys.all(), "deactivate"] as const,
};
