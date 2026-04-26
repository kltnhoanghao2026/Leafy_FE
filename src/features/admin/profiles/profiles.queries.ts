import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profilesApi } from "./profiles.api";
import { profileKeys } from "./profileKeys";
import type { ProfileListParams } from "../types";

export const useAdminProfiles = (params: ProfileListParams = {}) =>
  useQuery({
    queryKey: profileKeys.list(params),
    queryFn: () => profilesApi.listProfiles(params),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

export const useAdminProfileDetails = (profileId: string) =>
  useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => profilesApi.getProfileDetails(profileId),
    select: (response) => response.data.data,
    enabled: profileId.length > 0,
    staleTime: 60_000,
  });

export const useActivateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => profilesApi.activateProfile(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(profileId),
      });
    },
  });
};

export const useDeactivateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => profilesApi.deactivateProfile(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(profileId),
      });
    },
  });
};

export const useVerifyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => profilesApi.verifyProfile(profileId),
    onSuccess: (_data, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all() });
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(profileId),
      });
    },
  });
};
