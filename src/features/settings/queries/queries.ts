import { useQuery } from "@tanstack/react-query";
import { fileApi, isFileServiceReference } from "../../../lib/api/fileApi";
import { profileApi } from "../api/profile.api";
import { fileKeys, preferenceKeys, profileKeys } from "./keys";

export const useMyProfile = (enabled = true) =>
  useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.getMyProfile(),
    select: (response) => response.data.data,
    enabled,
  });

export const useProfileByUserId = (userId: string) =>
  useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileApi.getByUserId(userId),
    select: (response) => response.data.data,
    enabled: !!userId,
  });

export const useMyPreferences = () =>
  useQuery({
    queryKey: preferenceKeys.me(),
    queryFn: () => profileApi.getMyPreferences(),
    select: (response) => response.data.data,
  });

export const usePrivacySettingsByProfileId = (profileId: string) =>
  useQuery({
    queryKey: preferenceKeys.byProfile(profileId),
    queryFn: () => profileApi.getPrivacySettingsByProfileId(profileId),
    select: (response) => response.data.data,
    enabled: !!profileId,
  });

export const useFilePreviewUrl = (fileReference?: string | null) =>
  useQuery({
    queryKey: fileKeys.presignedUrl(fileReference ?? ""),
    queryFn: () => fileApi.getPresignedUrl(fileReference ?? ""),
    enabled: isFileServiceReference(fileReference),
    staleTime: 50 * 60 * 1000,
  });
