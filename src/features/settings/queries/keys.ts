export const profileKeys = {
  all: () => ["profiles"] as const,
  me: () => [...profileKeys.all(), "me"] as const,
  detail: (userId: string) => [...profileKeys.all(), "detail", userId] as const,
};

export const preferenceKeys = {
  all: () => ["preferences"] as const,
  me: () => [...preferenceKeys.all(), "me"] as const,
  byProfile: (profileId: string) => [...preferenceKeys.all(), "profile", profileId] as const,
};

export const fileKeys = {
  all: () => ["files"] as const,
  presignedUrl: (fileId: string) =>
    [...fileKeys.all(), "presigned-url", fileId] as const,
};
