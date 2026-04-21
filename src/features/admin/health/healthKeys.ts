export const healthKeys = {
  all: () => ["systemHealth"] as const,
  status: () => [...healthKeys.all(), "status"] as const,
};
