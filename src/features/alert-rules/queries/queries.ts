import { useQuery } from "@tanstack/react-query";
import { collectorApi } from "../../../lib/api/collectorApi";
import type { AlertRulesParams } from "../../../types/iot";
import { alertRuleKeys } from "./keys";

export const useAlertRules = (params: AlertRulesParams, enabled = true) =>
  useQuery({
    queryKey: alertRuleKeys.list(params),
    queryFn: () => collectorApi.getAlertRules(params),
    select: (response) => response.data,
    enabled,
  });

export const useAlertRule = (ruleId: string, enabled = true) =>
  useQuery({
    queryKey: alertRuleKeys.detail(ruleId),
    queryFn: () => collectorApi.getAlertRule(ruleId),
    select: (response) => response.data,
    enabled: enabled && !!ruleId,
  });
