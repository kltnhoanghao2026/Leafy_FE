export const pushKeys = {
  all: () => ["push-tokens"] as const,
  register: () => [...pushKeys.all(), "register"] as const,
  deactivate: () => [...pushKeys.all(), "deactivate"] as const,
};

export const notificationKeys = {
  all: () => ["notifications"] as const,
  state: () => [...notificationKeys.all(), "state"] as const,
  history: (unreadOnly?: boolean) => [...notificationKeys.all(), "history", { unreadOnly }] as const,
};
