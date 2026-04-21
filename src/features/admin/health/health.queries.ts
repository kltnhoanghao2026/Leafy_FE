import { useQuery } from "@tanstack/react-query";
import { healthApi } from "./health.api";
import { healthKeys } from "./healthKeys";

export const useSystemHealth = () =>
  useQuery({
    queryKey: healthKeys.status(),
    queryFn: () => healthApi.getSystemHealth(),
    select: (response) => response.data.data,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
