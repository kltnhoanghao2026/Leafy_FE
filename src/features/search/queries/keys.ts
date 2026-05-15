import type { SearchPlansParams, SearchPostsParams, SearchProfilesParams, UnifiedSearchParams } from "../types";

export const searchKeys = {
  all: () => ["search"] as const,
  posts: (params: SearchPostsParams) =>
    [...searchKeys.all(), "posts", params] as const,
  profiles: (params: SearchProfilesParams) =>
    [...searchKeys.all(), "profiles", params] as const,
  plans: (params: SearchPlansParams) =>
    [...searchKeys.all(), "plans", params] as const,
  unified: (params: UnifiedSearchParams) =>
    [...searchKeys.all(), "unified", params] as const,
};
