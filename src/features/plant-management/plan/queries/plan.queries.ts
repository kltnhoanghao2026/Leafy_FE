import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { treatmentPlanApi } from "../api/plan.api";
import type {
  PlanApplyRequest,
  PlanCreateRequest,
  PlanListParams,
  BulkPlanStatusUpdateRequest,
  BulkPlanDeleteRequest,
  TreatmentStatus,
} from "../../shared/types";
import { plantManagementKeys } from "../../shared/queries/keys";

export const useMyPlans = (params: PlanListParams = {}) =>
  useQuery({
    queryKey: plantManagementKeys.myPlans(params),
    queryFn: () => treatmentPlanApi.getMyTreatmentPlans(params),
  });

export const usePlan = (planId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plan(planId),
    queryFn: () => treatmentPlanApi.getTreatmentPlanById(planId),
    enabled: enabled && !!planId,
  });

export const useTreatmentPlanDetail = usePlan;

export const usePlansByPlant = (plantId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.plans(plantId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByPlant(plantId),
    enabled: enabled && !!plantId,
  });

export const useTreatmentPlansByFarmPlot = (
  farmPlotId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: plantManagementKeys.plansByFarmPlot(farmPlotId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByFarmPlot(farmPlotId),
    enabled: enabled && !!farmPlotId,
  });

export const useTreatmentPlansByFarmZone = (
  farmZoneId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: plantManagementKeys.plansByFarmZone(farmZoneId),
    queryFn: () => treatmentPlanApi.getTreatmentPlansByFarmZone(farmZoneId),
    enabled: enabled && !!farmZoneId,
  });

const invalidatePlanCaches = async (
  queryClient: ReturnType<typeof useQueryClient>,
  plan?: { id?: string; plantId?: string | null; farmPlotId?: string | null; farmZoneId?: string | null },
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: plantManagementKeys.plansRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: [...plantManagementKeys.all(), "plant-events"],
    }),
    plan?.id
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plan(plan.id),
        })
      : Promise.resolve(),
    plan?.plantId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plans(plan.plantId),
        })
      : Promise.resolve(),
    plan?.farmPlotId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansByFarmPlot(plan.farmPlotId),
        })
      : Promise.resolve(),
    plan?.farmZoneId
      ? queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansByFarmZone(plan.farmZoneId),
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

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlanCreateRequest) =>
      treatmentPlanApi.createPlan(payload),
    onSuccess: async (plan: any) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã tạo kế hoạch điều trị.",
    },
  });
};

export const useUpdatePlanStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      status,
    }: {
      planId: string;
      status: TreatmentStatus;
    }) => treatmentPlanApi.updateTreatmentPlanStatus(planId, status),
    onSuccess: async (plan: any) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã cập nhật trạng thái kế hoạch.",
    },
  });
};

export const useUpdatePlanVisibilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }: { planId: string }) =>
      treatmentPlanApi.togglePlanVisibility(planId),
    onSuccess: async (plan: any) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã cập nhật chế độ hiển thị kế hoạch.",
    },
  });
};


export const useDeletePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => treatmentPlanApi.deletePlan(planId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansRoot(),
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

export const useApplyPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: PlanApplyRequest;
    }) => treatmentPlanApi.applyPlan(planId, payload),
    onSuccess: async (_, { planId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plan(planId),
        }),
      ]);
    },
    meta: {
      successMessage: "Đã gửi yêu cầu áp dụng. Hệ thống đang xử lý...",
    },
  });
};

export const useBulkUpdatePlanStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkPlanStatusUpdateRequest) =>
      treatmentPlanApi.bulkUpdatePlanStatus(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansRoot(),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
      ]);
    },
    meta: { successMessage: "Đã cập nhật trạng thái các kế hoạch." },
  });
};

export const useBulkDeletePlansMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planIds: string[]) =>
      treatmentPlanApi.bulkDeletePlans({ planIds }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansRoot(),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
      ]);
    },
    meta: { successMessage: "Đã xóa các kế hoạch điều trị." },
  });
};

export const useBulkApplyPlansMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planIds,
      payload,
    }: {
      planIds: string[];
      payload: PlanApplyRequest;
    }) => Promise.all(planIds.map((planId) => treatmentPlanApi.applyPlan(planId, payload))),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plansRoot(),
        }),
      ]);
    },
    meta: { successMessage: "Đã gửi yêu cầu áp dụng. Hệ thống đang xử lý..." },
  });
};
