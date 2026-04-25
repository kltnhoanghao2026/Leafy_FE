import type { UserListParams } from "../../types";

export const userKeys = {
  all: () => ["adminUsers"] as const,
  lists: () => [...userKeys.all(), "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  searches: () => [...userKeys.all(), "search"] as const,
  search: (searchTerm: string, params: UserListParams) =>
    [...userKeys.searches(), searchTerm, params] as const,
};
