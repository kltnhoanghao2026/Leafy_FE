import apiClient from "../apiClient";
import { API_ENDPOINTS } from "../routes";
import type { ApiEnvelope } from "../../shared/types/api";
import type {
  SearchPostItem,
  SearchPostsParams,
  SearchProfileItem,
  SearchProfilesParams,
  SearchSpringPage,
  UnifiedSearchParams,
  UnifiedSearchResult,
} from "../../features/search/types";

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

const cleanParams = <T extends object>(params: T): Partial<T> => {
  const entries = Object.entries(params).filter(([, value]) => {
    return value !== undefined && value !== null && value !== "";
  });

  return Object.fromEntries(entries) as Partial<T>;
};

export const searchApi = {
  searchPosts: async (params: SearchPostsParams) => {
    const response = await apiClient.get<
      ApiEnvelope<SearchSpringPage<SearchPostItem>> | SearchSpringPage<SearchPostItem>
    >(API_ENDPOINTS.SEARCH.POSTS, {
      params: cleanParams(params),
    });
    return unwrapApiData(response.data);
  },

  searchProfiles: async (params: SearchProfilesParams) => {
    const response = await apiClient.get<
      ApiEnvelope<SearchSpringPage<SearchProfileItem>> | SearchSpringPage<SearchProfileItem>
    >(API_ENDPOINTS.SEARCH.PROFILES, {
      params: cleanParams(params),
    });
    return unwrapApiData(response.data);
  },

  unifiedSearch: async (params: UnifiedSearchParams) => {
    const response = await apiClient.get<
      ApiEnvelope<UnifiedSearchResult> | UnifiedSearchResult
    >(API_ENDPOINTS.SEARCH.UNIFIED, {
      params: cleanParams(params),
    });
    return unwrapApiData(response.data);
  },
};
