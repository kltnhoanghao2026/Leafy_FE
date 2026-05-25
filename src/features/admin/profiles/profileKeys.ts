import type { ProfileListParams } from "../types";

export const profileKeys = {
  all: () => ["adminProfiles"] as const,
  lists: () => [...profileKeys.all(), "list"] as const,
  list: (params: ProfileListParams) =>
    [...profileKeys.lists(), params] as const,
  searches: () => [...profileKeys.all(), "search"] as const,
  search: (searchTerm: string, params: ProfileListParams) =>
    [...profileKeys.searches(), searchTerm, params] as const,
  details: () => [...profileKeys.all(), "detail"] as const,
  detail: (profileId: string) => [...profileKeys.details(), profileId] as const,
};
