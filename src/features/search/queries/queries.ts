import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../../../lib/api/searchApi";
import type { SearchPostsParams, SearchProfilesParams } from "../types";
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
