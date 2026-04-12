import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { profileKeys } from "./keys";

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
