import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "./plans.api";
import { planKeys } from "./planKeys";
import type { PlanListParams, TreatmentStatus } from "../types";

export const useAdminPlans = (params: PlanListParams = {}) =>
  useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => plansApi.listAllPlans(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const useUpdatePlanStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string;
      status: TreatmentStatus;
    }) => plansApi.updatePlanStatus(planId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all() });
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all() });
    },
  });
};
