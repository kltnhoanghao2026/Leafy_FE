import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { treatmentPlanApi } from "../api/treatment-plan.api";
import type {
  TreatmentPlanCreateRequest,
  TreatmentPlanListParams,
  TreatmentStatus,
} from "../types";
import { plantManagementKeys } from "./keys";

export const useMyTreatmentPlans = (params: TreatmentPlanListParams = {}) =>
  useQuery({
    queryKey: plantManagementKeys.myTreatmentPlans(params),
    queryFn: () => treatmentPlanApi.getMyTreatmentPlans(params),
  });

export const useTreatmentPlan = (planId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.treatmentPlan(planId),
    queryFn: () => treatmentPlanApi.getTreatmentPlanById(planId),
    enabled: enabled && !!planId,
  });

export const useTreatmentPlanDetail = useTreatmentPlan;

export const useTreatmentPlansByPlant = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.treatmentPlans(plantId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByPlant(plantId),
    enabled: enabled && !!plantId,
  });

export const useTreatmentPlansByFarmPlot = (
  farmPlotId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: plantManagementKeys.treatmentPlansByFarmPlot(farmPlotId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByFarmPlot(farmPlotId),
    enabled: enabled && !!farmPlotId,
  });

export const useTreatmentPlansByFarmZone = (
  farmZoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: plantManagementKeys.treatmentPlansByFarmZone(farmZoneId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByFarmZone(farmZoneId),
    enabled: enabled && !!farmZoneId,
  });

const invalidatePlanCaches = async (
  queryClient: ReturnType<typeof useQueryClient>,
  plan?: { id?: string; plantId?: string | null; farmPlotId?: string | null; farmZoneId?: string | null },
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: plantManagementKeys.treatmentPlansRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: [...plantManagementKeys.all(), "plant-events"],
    }),
    plan?.id
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.treatmentPlan(plan.id),
        })
      : Promise.resolve(),
    plan?.plantId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.treatmentPlans(plan.plantId),
        })
      : Promise.resolve(),
    plan?.farmPlotId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.treatmentPlansByFarmPlot(plan.farmPlotId),
        })
      : Promise.resolve(),
    plan?.farmZoneId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.treatmentPlansByFarmZone(plan.farmZoneId),
        })
      : Promise.resolve(),
    plan?.plantId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEvents(plan.plantId),
        })
      : Promise.resolve(),
    plan?.plantId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plannedPlantEvents(plan.plantId),
        })
      : Promise.resolve(),
    plan?.id
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plantEventsByPlan(plan.id),
        })
      : Promise.resolve(),
  ]);
};

export const useCreateTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TreatmentPlanCreateRequest) =>
      treatmentPlanApi.createTreatmentPlan(payload),
    onSuccess: async (plan) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã tạo kế hoạch điều trị.",
    },
  });
};

export const useUpdateTreatmentPlanStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string;
      status: TreatmentStatus;
    }) => treatmentPlanApi.updateTreatmentPlanStatus(planId, status),
    onSuccess: async (plan) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã cập nhật trạng thái kế hoạch.",
    },
  });
};

export const useDeleteTreatmentPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => treatmentPlanApi.deleteTreatmentPlan(planId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.treatmentPlansRoot(),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
      ]);
    },
    meta: {
      successMessage: "Đã xóa kế hoạch điều trị.",
    },
  });
};
