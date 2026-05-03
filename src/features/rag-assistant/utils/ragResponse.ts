import type {
  RagApiResponse,
  RagChatResult,
  RagSource,
  RagPlan,
} from "../types";

export const unwrapRagResult = <T>(payload: T | RagApiResponse<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "result" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as RagApiResponse<T>).result as T;
  }

  return payload as T;
};

export const getChatAnswer = (result: RagChatResult | null | undefined) =>
  result?.answer ||
  result?.content ||
  result?.message ||
  "AI đã phản hồi nhưng không có nội dung hiển thị.";

export const getThreadId = (result: RagChatResult | null | undefined) =>
  result?.thread_id || result?.threadId || null;

export const normalizeSources = (
  result: RagChatResult | null | undefined,
): RagSource[] => [
  ...(result?.sources ?? []),
  ...(result?.documents ?? []),
  ...(result?.web_search_results ?? []),
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const normalizeTreatmentPlan = (
  value: unknown,
): RagPlan | null => {
  if (!isRecord(value)) return null;

  const nestedPlan = isRecord(value.plan) ? value.plan : {};
  const planId = value.planId || value.id || nestedPlan.planId || nestedPlan.id;
  const title =
    value.title ||
    value.name ||
    nestedPlan.title ||
    nestedPlan.name ||
    "Kế hoạch điều trị AI";
  const diseaseName =
    value.diseaseName ||
    value.disease_name ||
    nestedPlan.diseaseName ||
    nestedPlan.disease_name ||
    null;

  return {
    ...(value as RagPlan),
    id: typeof planId === "string" ? planId : undefined,
    planId: typeof planId === "string" ? planId : undefined,
    title: typeof title === "string" ? title : "Kế hoạch điều trị AI",
    diseaseName: typeof diseaseName === "string" ? diseaseName : null,
    summary:
      typeof value.summary === "string"
        ? value.summary
        : typeof nestedPlan.summary === "string"
          ? nestedPlan.summary
          : undefined,
    schedule: value.schedule ?? nestedPlan.schedule,
    steps: Array.isArray(value.steps)
      ? value.steps
      : Array.isArray(nestedPlan.steps)
        ? nestedPlan.steps
        : undefined,
    plan: isRecord(value.plan) ? value.plan : nestedPlan,
  };
};

export const getTreatmentPlanFromChat = (
  result: RagChatResult | null | undefined,
): RagPlan | null =>
  normalizeTreatmentPlan(
    result?.plan,
  );

export const getPlanTitle = (plan: RagPlan) =>
  plan.title || plan.name || plan.planId || plan.id || "Kế hoạch điều trị AI";

export const getPlanStepCount = (plan: RagPlan) => {
  if (Array.isArray(plan.steps)) return plan.steps.length;
  if (Array.isArray(plan.schedule)) return plan.schedule.length;
  if (
    plan.schedule &&
    typeof plan.schedule === "object" &&
    Array.isArray((plan.schedule as { steps?: unknown[] }).steps)
  ) {
    return (plan.schedule as { steps: unknown[] }).steps.length;
  }
  return 0;
};
