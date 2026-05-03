import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { treatmentPlansApi } from "./treatmentPlans.api";
import { treatmentPlanKeys } from "./treatmentPlanKeys";
import type { TreatmentPlanListParams, TreatmentStatus } from "../types";

export const useAdminTreatmentPlans = (params: TreatmentPlanListParams = {}) =>
  useQuery({
    queryKey: treatmentPlanKeys.list(params),
    queryFn: () => treatmentPlansApi.listAllPlans(params),
    select: (res) => res.data.data,
    staleTime: 30_000,
  });

export const useUpdateTreatmentPlanStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string;
      status: TreatmentStatus;
    }) => treatmentPlansApi.updatePlanStatus(planId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentPlanKeys.all() });
    },
  });
};

export const useDeleteTreatmentPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => treatmentPlansApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: treatmentPlanKeys.all() });
    },
  });
};
