import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../../../lib/api/searchApi";
import type { SearchPostsParams, SearchProfilesParams, UnifiedSearchParams } from "../types";
import { normalizeSearchPage } from "../utils";
import { searchKeys } from "./keys";

const hasSearchTerm = (searchTerm: string) => searchTerm.trim().length >= 2;

export const useSearchPosts = (
  params: SearchPostsParams,
  enabled = true,
) =>
  useQuery({
    queryKey: searchKeys.posts(params),
    queryFn: () => searchApi.searchPosts(params),
    select: normalizeSearchPage,
    enabled: enabled && hasSearchTerm(params.searchTerm),
  });

export const useSearchProfiles = (
  params: SearchProfilesParams,
  enabled = true,
) =>
  useQuery({
    queryKey: searchKeys.profiles(params),
    queryFn: () => searchApi.searchProfiles(params),
    select: normalizeSearchPage,
    enabled: enabled && hasSearchTerm(params.searchTerm),
  });

export const useUnifiedSearch = (
  params: UnifiedSearchParams,
  enabled = true,
) =>
  useQuery({
    queryKey: searchKeys.unified(params),
    queryFn: () => searchApi.unifiedSearch(params),
    enabled: enabled && hasSearchTerm(params.searchTerm),
    staleTime: 30_000,   // 30s — unified results are expensive; reuse aggressively
  });
