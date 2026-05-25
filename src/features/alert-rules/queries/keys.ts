import type { AlertRulesParams } from "../../../types/iot";

export const alertRuleKeys = {
  all: () => ["iot-alert-rules"] as const,
  list: (params: AlertRulesParams) =>
    [...alertRuleKeys.all(), "list", params] as const,
  detail: (ruleId: string) =>
    [...alertRuleKeys.all(), "detail", ruleId] as const,
};
