import type {
  PlantEventCreateRequest,
  PlantEventType,
  PlanCreateRequest,
} from "../../plant-management/shared/types";
import type { RagPlan } from "../types";
import { getPlanTitle } from "./ragResponse";
import {
  addLocalDays,
  daysBetweenDateOnly,
  getTodayDateOnly,
  isValidDateOnly,
  toLocalDateOnly,
} from "../../plant-management/shared/utils/dateOnly";

export interface ReviewScheduleItem {
  id: string;
  enabled: boolean;
  eventType: PlantEventType;
  note: string;
  description: string;
  scheduledDate: string;
  durationDays: number;
  phiDays?: number;
  ppeRequired?: string;
  mrlNote?: string;
  estimatedCost?: string;
}

export interface RagPlanFormValues {
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  title: string;
  diseaseName: string;
  confidenceScore?: number;
  severityLevel?: string;
  urgency?: string;
  startDate: string;
  schedule: ReviewScheduleItem[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const result = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return result.length ? result : undefined;
};

const normalizeDate = (value: unknown, startDate: string) => {
  const raw = toString(value);
  if (!raw) return startDate;
  if (isValidDateOnly(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return startDate;
  return toLocalDateOnly(parsed);
};

const normalizeEventType = (value: unknown): PlantEventType => {
  const raw = toString(value).toUpperCase();
  const supported: PlantEventType[] = [
    "IRRIGATION",
    "NUTRITION",
    "WEED_CONTROL",
    "PRUNING",
    "SCOUTING",
    "DISEASE_DETECTED",
    "TREATMENT_APPLICATION",
    "QUARANTINE",
    "HEALTH_RECOVERY",
    "PHENOLOGY",
    "REPOT",
    "HARVEST",
  ];
  return supported.includes(raw as PlantEventType)
    ? (raw as PlantEventType)
    : "TREATMENT_APPLICATION";
};

const getNestedPlan = (plan: RagPlan) =>
  isRecord(plan.plan) ? plan.plan : {};

const getScheduleCandidates = (plan: RagPlan): unknown[] => {
  const nestedPlan = getNestedPlan(plan);
  const nestedSchedule = nestedPlan.schedule;
  const nestedSteps = nestedPlan.steps;

  if (Array.isArray(plan.schedule)) return plan.schedule;
  if (Array.isArray(plan.steps)) return plan.steps;
  if (Array.isArray(nestedSchedule)) return nestedSchedule;
  if (isRecord(plan.schedule) && Array.isArray(plan.schedule.steps)) {
    return plan.schedule.steps;
  }
  if (Array.isArray(nestedSteps)) return nestedSteps;
  return [];
};

export const getTodayDate = getTodayDateOnly;

export const buildInitialPlanFormValues = (
  plan: RagPlan,
  startDate = getTodayDate(),
): RagPlanFormValues => {
  const nestedPlan = getNestedPlan(plan);
  const diseaseName =
    plan.diseaseName ||
    toString(nestedPlan.diseaseName) ||
    toString(nestedPlan.disease_name) ||
    "BÃ¡Â»â¡nh cÃÂ¢y cÃ¡ÂºÂ§n xÃ¡Â»Â­ lÃÂ½";

  return {
    plantId: plan.plantId ?? undefined,
    farmPlotId: plan.farmPlotId ?? undefined,
    farmZoneId: plan.farmZoneId ?? undefined,
    title: getPlanTitle(plan),
    diseaseName,
    confidenceScore: toNumber(
      (plan as Record<string, unknown>).confidenceScore ??
        nestedPlan.confidenceScore ??
        nestedPlan.confidence_score,
    ),
    severityLevel:
      plan.severityLevel || toString(nestedPlan.severityLevel) || undefined,
    urgency: plan.urgency || toString(nestedPlan.urgency) || undefined,
    startDate,
    schedule: mapRagPlanToReviewSchedule(plan, startDate),
  };
};

export const mapRagPlanToReviewSchedule = (
  plan: RagPlan,
  startDate: string,
): ReviewScheduleItem[] =>
  getScheduleCandidates(plan).map((item, index) => {
    const record = isRecord(item) ? item : {};
    const dayOffset =
      toNumber(record.dayOffset) ??
      toNumber(record.day_offset) ??
      toNumber(record.daysFromNow) ??
      toNumber(record.days_from_now) ??
      index;
    const scheduledDate =
      normalizeDate(
        record.scheduledDate ??
        record.scheduled_at ??
          record.date ??
          record.calculatedStartDate,
        addLocalDays(startDate, dayOffset),
      ) || addLocalDays(startDate, dayOffset);
    const note =
      toString(record.note) ||
      toString(record.title) ||
      toString(record.name) ||
      (typeof item === "string" ? item : "") ||
      `BÃÂ°Ã¡Â»âºc ${index + 1}`;

    return {
      id: `${index}-${note}`,
      enabled: true,
      eventType: normalizeEventType(record.eventType ?? record.event_type),
      note,
      description:
        toString(record.description) ||
        toString(record.details) ||
        toString(record.instruction) ||
        note,
      scheduledDate,
      durationDays: toNumber(record.durationDays ?? record.duration_days) ?? 1,
      phiDays: toNumber(record.phiDays ?? record.phi_days),
      ppeRequired: toString(record.ppeRequired ?? record.ppe_required) || undefined,
      mrlNote: toString(record.mrlNote ?? record.mrl_note) || undefined,
      estimatedCost: toString(record.estimatedCost ?? record.estimated_cost) || undefined,
    };
  });

export const buildCreatePlanRequest = (
  plan: RagPlan,
  values: RagPlanFormValues,
): PlanCreateRequest => {
  const nestedPlan = getNestedPlan(plan);
  const schedule: PlantEventCreateRequest[] = values.schedule
    .filter((item) => item.enabled)
    .map((item) => ({
      plantId: values.plantId || undefined,
      farmPlotId: values.farmPlotId || undefined,
      farmZoneId: values.farmZoneId || undefined,
      eventType: item.eventType,
      note: item.note.trim() || "LÃ¡Â»â¹ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹",
      description: item.description.trim() || undefined,
      daysFromNow: daysBetweenDateOnly(values.startDate, item.scheduledDate),
      durationDays: item.durationDays,
      isPlanned: true,
      calculatedStartDate: item.scheduledDate,
      calculatedEndDate: addLocalDays(
        item.scheduledDate,
        Math.max(0, item.durationDays - 1),
      ),
      phiDays: item.phiDays,
      ppeRequired: item.ppeRequired,
      mrlNote: item.mrlNote,
      estimatedCost: item.estimatedCost,
      sourcePlanId: plan.planId || plan.id,
    }));

  return {
    ragPlanId: plan.planId || plan.id,
    question: plan.question,
    source:
      (toString((plan as Record<string, unknown>).source) === "websearch"
        ? "websearch"
        : toString((plan as Record<string, unknown>).source) === "documents"
          ? "documents"
          : toString(nestedPlan.source) === "websearch"
            ? "websearch"
            : toString(nestedPlan.source) === "documents"
              ? "documents"
          : undefined),
    plantId: values.plantId || undefined,
    farmPlotId: values.farmPlotId || undefined,
    farmZoneId: values.farmZoneId || undefined,
    diseaseName: (values as any).diseaseName.trim() || "BÃ¡Â»â¡nh cÃÂ¢y cÃ¡ÂºÂ§n xÃ¡Â»Â­ lÃÂ½",
    confidenceScore: values.confidenceScore,
    severityLevel: values.severityLevel || undefined,
    urgency: values.urgency || undefined,
    requiredInputs: toStringArray(nestedPlan.requiredInputs ?? nestedPlan.required_inputs),
    safetyWarnings: toStringArray(nestedPlan.safetyWarnings ?? nestedPlan.safety_warnings),
    successIndicators:
      toString(nestedPlan.successIndicators ?? nestedPlan.success_indicators) ||
      plan.summary ||
      getPlanTitle(plan),
    estimatedCost:
      toString(nestedPlan.estimatedCost ?? nestedPlan.estimated_cost) || undefined,
    schedule,
  };
};
