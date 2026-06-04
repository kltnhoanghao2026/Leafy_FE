import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";
import type { ApiEnvelope } from "../../../../shared/types/api";
import type {
  PageResponse,
  RagPlanListParams,
  RagPlanResponse,
  RagPlanScheduleEvent,
  RagPlanSourceDocument,
  RagPlanWebSearchResult,
} from "../../shared/types";
import { unwrapApiData } from "../../shared/api/apiUtils";

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return {};
};

const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
};

const normalizeSourceDocument = (value: unknown): RagPlanSourceDocument => {
  const record = asRecord(value);
  const metadata = asRecord(record.metadata);

  return {
    title:
      asString(record.title) ??
      asString(metadata.section_title) ??
      asString(metadata.source_file) ??
      asString(metadata.original_filename) ??
      "Tài liệu",
    content: asString(record.content) ?? asString(record.page_content) ?? asString(record.pageContent) ?? "",
    pageContent: asString(record.page_content) ?? asString(record.pageContent) ?? asString(record.content) ?? "",
    url: asString(record.url),
    score: asNumber(record.score) ?? asNumber(metadata.rerank_score) ?? 0,
    pointId: asString(record.point_id) ?? asString(metadata.point_id),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
};

const normalizeWebSearchResult = (value: unknown): RagPlanWebSearchResult => {
  const record = asRecord(value);
  return {
    title: asString(record.title) ?? "",
    content: asString(record.content) ?? "",
    url: asString(record.url),
    score: asNumber(record.score) ?? 0,
  };
};

const normalizeSchedule = (value: unknown): RagPlanScheduleEvent[] | null => {
  if (!Array.isArray(value)) return null;

  return value.map((item) => {
    const record = asRecord(item);
    const rawTasks = Array.isArray(record.tasks) ? record.tasks : [];

    return {
      eventType: asString(record.eventType) ?? "",
      targetType: asString(record.targetType),
      note: asString(record.note),
      description: asString(record.description),
      daysFromStart: asNumber(record.daysFromStart),
      durationDays: asNumber(record.durationDays),
      phiDays: asNumber(record.phiDays),
      ppeRequired: asString(record.ppeRequired),
      mrlNote: asString(record.mrlNote),
      estimatedCost: asString(record.estimatedCost),
      tasks: rawTasks.map((task) => {
        const taskRecord = asRecord(task);
        return {
          title: asString(taskRecord.title) ?? "",
          description: asString(taskRecord.description),
          order: asNumber(taskRecord.order),
          estimatedCost: asString(taskRecord.estimatedCost),
          completed: typeof taskRecord.completed === "boolean" ? taskRecord.completed : null,
        };
      }),
    };
  });
};

const normalizeRagPlan = (value: unknown, fallbackPlanId: string): RagPlanResponse | null => {
  const raw = asRecord(value);
  if (Object.keys(raw).length === 0) return null;

  const nestedPlan = asRecord(raw.plan);
  const hasNestedPlan = Object.keys(nestedPlan).length > 0;

  return {
    planId: asString(raw.planId) ?? fallbackPlanId,
    userId: asString(raw.userId),
    question: asString(raw.question),
    plantId: asString(raw.plantId) ?? asString(nestedPlan.plantId),
    diseaseName: asString(raw.diseaseName) ?? asString(nestedPlan.diseaseName),
    severityLevel: asString(raw.severityLevel) ?? asString(nestedPlan.severityLevel),
    urgency: asString(raw.urgency) ?? asString(nestedPlan.urgency),
    source: asString(raw.source) ?? asString(nestedPlan.source),
    sourceType: asString(raw.sourceType),
    plan: hasNestedPlan
      ? {
          plantId: asString(nestedPlan.plantId),
          planName: asString(nestedPlan.planName),
          diseaseName: asString(nestedPlan.diseaseName),
          confidenceScore: asNumber(nestedPlan.confidenceScore),
          severityLevel: asString(nestedPlan.severityLevel),
          source: asString(nestedPlan.source),
          farmPlotId: asString(nestedPlan.farmPlotId),
          farmZoneId: asString(nestedPlan.farmZoneId),
          schedule: normalizeSchedule(nestedPlan.schedule),
          requiredInputs: asStringArray(nestedPlan.requiredInputs),
          safetyWarnings: asStringArray(nestedPlan.safetyWarnings),
          successIndicators: asString(nestedPlan.successIndicators),
          estimatedCost: asString(nestedPlan.estimatedCost),
          urgency: asString(nestedPlan.urgency) ?? asString(raw.urgency),
        }
      : {
          plantId: asString(raw.plantId),
          planName: asString(raw.planName),
          diseaseName: asString(raw.diseaseName),
          confidenceScore: asNumber(raw.confidenceScore),
          severityLevel: asString(raw.severityLevel),
          source: asString(raw.source),
          farmPlotId: asString(raw.farmPlotId),
          farmZoneId: asString(raw.farmZoneId),
          schedule: normalizeSchedule(raw.schedule),
          requiredInputs: asStringArray(raw.requiredInputs),
          safetyWarnings: asStringArray(raw.safetyWarnings),
          successIndicators: asString(raw.successIndicators),
          estimatedCost: asString(raw.estimatedCost),
          urgency: asString(raw.urgency),
        },
    sourceDocuments: Array.isArray(raw.source_documents)
      ? raw.source_documents.map(normalizeSourceDocument)
      : Array.isArray(raw.sourceDocuments)
        ? raw.sourceDocuments.map(normalizeSourceDocument)
        : null,
    webSearchResults: Array.isArray(raw.web_search_results)
      ? raw.web_search_results.map(normalizeWebSearchResult)
      : Array.isArray(raw.webSearchResults)
        ? raw.webSearchResults.map(normalizeWebSearchResult)
        : null,
    plantManagementPlanId: asString(raw.plantManagementPlanId),
    createdAt: asString(raw.createdAt),
    lastModifiedAt: asString(raw.lastModifiedAt),
  };
};

const normalizeRagPlanDetail = (value: unknown, fallbackPlanId: string): RagPlanResponse | null => {
  return normalizeRagPlan(value, fallbackPlanId);
};

export const ragPlanApi = {
  getMyRagPlans: async (params: RagPlanListParams = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<RagPlanResponse[]> | RagPlanResponse[]
    >(API_ENDPOINTS.RAG_PLANS.LIST, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    const data = unwrapApiData(response.data);
    const rawItems = Array.isArray(data)
      ? data
      : (data as PageResponse<RagPlanResponse>).content ?? [];

    return rawItems
      .map((item, index) => normalizeRagPlan(item, `rag-plan-${index}`))
      .filter((item): item is RagPlanResponse => item !== null);
  },

  getRagPlanById: async (planId: string) => {
    const response = await apiClient.get<ApiEnvelope<RagPlanResponse>>(
      API_ENDPOINTS.RAG_PLANS.ITEM(planId),
    );
    const data = unwrapApiData(response.data);
    return normalizeRagPlanDetail(data, planId);
  },
};
