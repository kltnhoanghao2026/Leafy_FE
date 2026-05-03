import type { SearchPostsParams, SearchProfilesParams } from "../types";

export const searchKeys = {
  all: () => ["search"] as const,
  posts: (params: SearchPostsParams) =>
    [...searchKeys.all(), "posts", params] as const,
  profiles: (params: SearchProfilesParams) =>
    [...searchKeys.all(), "profiles", params] as const,
};
