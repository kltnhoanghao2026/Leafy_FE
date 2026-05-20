import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  DiagnoseRequest,
  DiagnoseResult,
  PageResponse,
  PredictHealthResponse,
  PredictResponse,
} from "../types";

interface RagApiResponseV2 {
  code: number;
  message: string;
  result?: PlanGenerationResponseV2;
}

interface PlanGenerationResponseV2 {
  plan: Record<string, unknown>;
  documents: Array<{ title: string; content: string; url?: string; score: number }>;
  web_sources: Array<{ title: string; content: string; url?: string; score: number }>;
  metadata: {
    disease_type: string;
    best_rerank_score: number;
    web_search_used: boolean;
    web_sources_count: number;
    refinement_attempts: number;
    safety_passed: boolean;
  };
  saved_plan_id: string | null;
}

const unwrapApiData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    ("code" in payload || "message" in payload)
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
};

const toFormData = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

const multipartConfig = {
  transformRequest: [
    (data: FormData, headers: { delete?: (header: string) => void }) => {
      // apiClient defaults to JSON. Let the browser/axios attach multipart boundary.
      headers.delete?.("Content-Type");
      return data;
    },
  ],
};

export const diseaseApi = {
  predictDisease: async (file: File, plantId?: string) => {
    const formData = toFormData(file);
    if (plantId) {
      formData.append("plantId", plantId);
    }
    const response = await apiClient.post<
      ApiEnvelope<PredictResponse> | PredictResponse
    >(API_ENDPOINTS.DISEASES.PREDICT, formData, multipartConfig);
    return unwrapApiData(response.data);
  },

  updateDiagnosePlant: async (requestId: string, plantId: string | null) => {
    const response = await apiClient.put<ApiEnvelope<void> | void>(
      `${API_ENDPOINTS.DISEASES.DIAGNOSE_REQUEST(requestId)}/plant`,
      { plantId },
    );
    return unwrapApiData(response.data);
  },

  predictDiseaseTflite: async (file: File) => {
    const response = await apiClient.post<
      ApiEnvelope<PredictResponse> | PredictResponse
    >(API_ENDPOINTS.DISEASES.PREDICT_TFLITE, toFormData(file), multipartConfig);
    return unwrapApiData(response.data);
  },

  getPredictHealth: async () => {
    const response = await apiClient.get<PredictHealthResponse>(
      API_ENDPOINTS.DISEASES.PREDICT_HEALTH,
    );
    return response.data;
  },

  detectLeaf: async (file: File) => {
    const response = await apiClient.post<ApiEnvelope<unknown> | unknown>(
      API_ENDPOINTS.DISEASES.DETECT_LEAF,
      toFormData(file),
      multipartConfig,
    );
    return unwrapApiData(response.data);
  },

  getDiagnoseRequests: async (params: { page?: number; size?: number } = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<DiagnoseRequest>> | PageResponse<DiagnoseRequest>
    >(API_ENDPOINTS.DISEASES.DIAGNOSE_REQUESTS, {
      params: { page: params.page ?? 0, size: params.size ?? 50 },
    });
    return unwrapApiData(response.data);
  },

  getDiagnoseResults: async (params: { page?: number; size?: number } = {}) => {
    const response = await apiClient.get<
      ApiEnvelope<PageResponse<DiagnoseResult>> | PageResponse<DiagnoseResult>
    >(API_ENDPOINTS.DISEASES.DIAGNOSE_RESULTS, {
      params: { page: params.page ?? 0, size: params.size ?? 50 },
    });
    return unwrapApiData(response.data);
  },

  getDiagnoseRequestById: async (id: string) => {
    const response = await apiClient.get<
      ApiEnvelope<DiagnoseRequest> | DiagnoseRequest
    >(API_ENDPOINTS.DISEASES.DIAGNOSE_REQUEST(id));
    return unwrapApiData(response.data);
  },

  getResultsByRequest: async (id: string) => {
    const response = await apiClient.get<
      ApiEnvelope<DiagnoseResult> | DiagnoseResult
    >(API_ENDPOINTS.DISEASES.DIAGNOSE_RESULT_BY_REQUEST(id));
    return unwrapApiData(response.data);
  },

  deleteDiagnoseRequest: async (id: string) => {
    await apiClient.delete<ApiEnvelope<void> | void>(
      API_ENDPOINTS.DISEASES.DIAGNOSE_REQUEST(id),
    );
  },

  generateTreatmentPlan: async (payload: {
    disease_name: string;
    plantId?: string;
    farmPlotId?: string;
    farmZoneId?: string;
    language?: string;
    image_url?: string;
  }) => {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.RAG.GENERATE_PLAN,
      {
        disease_name: payload.disease_name,
        plant_id: payload.plantId,
        farm_plot_id: payload.farmPlotId,
        farm_zone_id: payload.farmZoneId,
        language: payload.language,
        image_url: payload.image_url,
      }
    );
    // The RAG service uses { code, message, result } (not { data }) as its
    // envelope — unwrapApiData only checks for "data", so we handle it here.
    const envelope = response.data;
    if (
      envelope &&
      typeof envelope === "object" &&
      "result" in envelope &&
      ("code" in envelope || "message" in envelope)
    ) {
      return envelope.result;
    }
    return envelope;
  },

  /**
   * V2: calls POST /rag/v2/plans/generate.
   * Returns the raw plan + documents + metadata without auto-saving.
   * The frontend is responsible for persisting the plan via plant-management-service.
   */
  generateTreatmentPlanV2: async (
    payload: {
      disease_name: string;
      /** Severity level from disease detection: LOW | MEDIUM | HIGH. Drives plan aggressiveness. */
      severity_level?: string;
      plantId?: string;
      farmPlotId?: string;
      farmZoneId?: string;
      language?: string;
      image_url?: string;
      include_web_search?: boolean;
    },
  ): Promise<PlanGenerationResponseV2> => {
    const response = await apiClient.post<
      RagApiResponseV2 | PlanGenerationResponseV2
    >(
      API_ENDPOINTS.RAG.GENERATE_PLAN_V2,
      {
        disease_name: payload.disease_name,
        severity_level: payload.severity_level,
        plant_id: payload.plantId,
        farm_plot_id: payload.farmPlotId,
        farm_zone_id: payload.farmZoneId,
        language: payload.language,
        image_url: payload.image_url,
        include_web_search: payload.include_web_search,
      },
    );

    // V2 uses { code, message, result } envelope
    const envelope = response.data;
    if (
      envelope &&
      typeof envelope === "object" &&
      "result" in envelope &&
      ("code" in envelope || "message" in envelope)
    ) {
      return (envelope as RagApiResponseV2).result as PlanGenerationResponseV2;
    }
    return envelope as PlanGenerationResponseV2;
  },
};
