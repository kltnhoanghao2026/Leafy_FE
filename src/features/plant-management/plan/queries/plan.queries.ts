import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { treatmentPlanApi } from "../api/plan.api";
import type {
  MyAppliesParams,
  PlanApplyRequest,
  PlanCreateRequest,
  PlanUpdateRequest,
  BulkApplyCustomRequest,
  PlanListParams,
  PublicPlanListParams,
  BulkPlanStatusUpdateRequest,
  TreatmentStatus,
  PlanDto,
  ApplyToAllFarmsRequest,
} from "../../shared/types";
import { plantManagementKeys } from "../../shared/queries/keys";

export const useMyPlans = (params: PlanListParams = {}) =>
  useQuery({
    queryKey: plantManagementKeys.myPlans(params),
    queryFn: () => treatmentPlanApi.getMyTreatmentPlans(params),
  });

export const usePublicPlans = (params: PublicPlanListParams = {}) =>
  useQuery({
    queryKey: plantManagementKeys.publicPlans(params),
    queryFn: () => treatmentPlanApi.getPublicPlans(params),
  });

export const useMyApplies = (params: MyAppliesParams = {}) =>
  useQuery({
    queryKey: plantManagementKeys.myApplies(params),
    queryFn: () => treatmentPlanApi.getMyApplies(params),
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

// ── PlanApply queries ────────────────────────────────────────────────────

export const usePlanApplies = (planId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.planApplies(planId),
    queryFn: () => treatmentPlanApi.getAppliesByPlan(planId),
    enabled: enabled && !!planId,
  });

export const usePlanApplyDetail = (applyId: string, enabled = true) =>
  useQuery({
    queryKey: plantManagementKeys.planApply(applyId),
    queryFn: () => treatmentPlanApi.getApplyById(applyId),
    enabled: enabled && !!applyId,
  });

// ── Cache invalidation ────────────────────────────────────────────────────

const invalidatePlanCaches = async (
  queryClient: ReturnType<typeof useQueryClient>,
  plan?: { id?: string },
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
    onSuccess: async (plan: PlanDto) => {
      try {
        await invalidatePlanCaches(queryClient, plan);
      } catch (e) {
        console.warn('[useCreatePlan] Cache invalidation failed (non-fatal):', e);
      }
    },
    meta: {
      successMessage: "Đã tạo kế hoạch điều trị.",
    },
  });
};

export const useUpdatePlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PlanUpdateRequest }) =>
      treatmentPlanApi.updatePlan(planId, payload),
    onSuccess: async (plan: PlanDto) => {
      await invalidatePlanCaches(queryClient, plan);
    },
    meta: {
      successMessage: "Đã cập nhật kế hoạch điều trị.",
    },
  });
};

export const useUpdatePlanVisibilityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }: { planId: string }) =>
      treatmentPlanApi.togglePlanVisibility(planId),
    onSuccess: async (plan: PlanDto) => {
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
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.planApplies(planId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.plansRoot(), "my-applies"],
        }),
      ]);
    },
    meta: {
      // successMessage removed per user request
    },
  });
};

export const useApplyPlanToAllFarmsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: string;
      payload: ApplyToAllFarmsRequest;
    }) => treatmentPlanApi.applyPlanToAllFarms(planId, payload),
    onSuccess: async (_, { planId }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.all(), "plant-events"],
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.plan(planId),
        }),
        queryClient.invalidateQueries({
          queryKey: plantManagementKeys.planApplies(planId),
        }),
        queryClient.invalidateQueries({
          queryKey: [...plantManagementKeys.plansRoot(), "my-applies"],
        }),
      ]);
    },
    meta: {
      // successMessage removed per user request
    },
  });
};

// ── Apply status mutation ────────────────────────────────────────────────

export const useUpdateApplyStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applyId,
      status,
    }: {
      applyId: string;
      status: TreatmentStatus;
    }) => treatmentPlanApi.updateApplyStatus(applyId, status),
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
      successMessage: "Đã cập nhật trạng thái áp dụng.",
    },
  });
};

export const useCancelApplyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (applyId: string) => treatmentPlanApi.cancelApply(applyId),
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
      successMessage: "Đã hủy áp dụng kế hoạch. Các sự kiện chưa hoàn thành đã được xóa.",
    },
  });
};

export const useCompleteApplyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applyId, success }: { applyId: string; success: boolean }) =>
      treatmentPlanApi.completeApply(applyId, success),
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
      successMessage: "Đã kết thúc kế hoạch.",
    },
  });
};

export const useBulkUpdateApplyStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkPlanStatusUpdateRequest) =>
      treatmentPlanApi.bulkUpdateApplyStatus(payload),
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
    meta: { successMessage: "Đã cập nhật trạng thái các áp dụng." },
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
    meta: { 
      // successMessage removed per user request 
    },
  });
};

export const useBulkApplyCustomMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkApplyCustomRequest) =>
      treatmentPlanApi.bulkApplyCustom(payload),
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
    meta: { 
      // successMessage removed per user request
    },
  });
};
