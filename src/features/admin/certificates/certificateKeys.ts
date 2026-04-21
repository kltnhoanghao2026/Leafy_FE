export const certificateKeys = {
  all: () => ["admin", "certificates"] as const,
  pending: () => ["admin", "certificates", "pending"] as const,
  processed: () => ["admin", "certificates", "processed"] as const,
};
