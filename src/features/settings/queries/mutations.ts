import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fileApi } from "../../../lib/api/fileApi";
import { profileApi } from "../api/profile.api";
import { preferenceKeys, profileKeys } from "./keys";
import type {
  AppearanceSettingsUpdateRequest,
  GeneralSettingsUpdateRequest,
  PrivacySettingsUpdateRequest,
  NotificationSettingsUpdateRequest,
  ProfileUpdateRequest,
} from "../types";

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: ProfileUpdateRequest;
    }) => profileApi.updateByUserId(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
  });
};

export const useUpdateAppearancePreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppearanceSettingsUpdateRequest) =>
      profileApi.updateAppearancePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferenceKeys.me() });
    },
    meta: {
      successMessage: "Display preferences saved.",
    },
  });
};

export const useUpdateGeneralPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeneralSettingsUpdateRequest) =>
      profileApi.updateGeneralPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferenceKeys.me() });
    },
  });
};

export const useUpdatePrivacyPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PrivacySettingsUpdateRequest) =>
      profileApi.updatePrivacyPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferenceKeys.me() });
    },
  });
};

export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NotificationSettingsUpdateRequest) =>
      profileApi.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferenceKeys.me() });
    },
  });
};

export const useUploadFileMutation = () =>
  useMutation({
    mutationFn: (file: File) => fileApi.uploadFile(file),
  });
