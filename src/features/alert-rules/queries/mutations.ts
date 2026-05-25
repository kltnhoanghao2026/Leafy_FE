import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type {
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
} from "../../../types/iot";
import { alertRuleKeys } from "./keys";

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAlertRuleRequest) =>
      collectorApi.createAlertRule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: alertRuleKeys.all() });
    },
    meta: {
      successMessage: "Alert rule created.",
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ruleId,
      payload,
    }: {
      ruleId: string;
      payload: UpdateAlertRuleRequest;
    }) => collectorApi.updateAlertRule(ruleId, payload),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertRuleKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: alertRuleKeys.detail(variables.ruleId),
        }),
      ]);
    },
    meta: {
      successMessage: "Alert rule updated.",
    },
  });
};

export const useUpdateAlertRuleEnabled = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      collectorApi.updateAlertRuleEnabled(ruleId, { enabled }),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: alertRuleKeys.all() }),
        queryClient.invalidateQueries({
          queryKey: alertRuleKeys.detail(variables.ruleId),
        }),
      ]);
    },
    meta: {
      successMessage: "Alert rule status updated.",
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => collectorApi.deleteAlertRule(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: alertRuleKeys.all() });
    },
    meta: {
      successMessage: "Alert rule deleted.",
    },
  });
};
