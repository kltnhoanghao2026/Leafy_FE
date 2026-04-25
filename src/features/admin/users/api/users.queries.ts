import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./users.api";
import { userKeys } from "./userKeys";
import type { UserListParams } from "../../types";

export const useAdminUsers = (params: UserListParams = {}) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.listUsers(params),
    select: (response) => response.data.data,
    staleTime: 30_000,
  });

export const useAdminSearchUsers = (
  searchTerm: string,
  params: UserListParams = {},
) =>
  useQuery({
    queryKey: userKeys.search(searchTerm, params),
    queryFn: () => usersApi.searchUsers(searchTerm, params),
    select: (response) => response.data.data,
    enabled: searchTerm.trim().length > 0,
    staleTime: 30_000,
  });

export const useActivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all() });
    },
  });
};
