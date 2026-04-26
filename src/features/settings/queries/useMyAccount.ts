import { useQuery } from "@tanstack/react-query";
import { userAccountApi } from "../api/userAccount.api";

export const accountKeys = {
  all: () => ["account"] as const,
  me: () => [...accountKeys.all(), "me"] as const,
};

export const useMyAccount = (enabled = true) =>
  useQuery({
    queryKey: accountKeys.me(),
    queryFn: () => userAccountApi.getMyAccount(),
    select: (response) => response.data.data,
    enabled,
  });
