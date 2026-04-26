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
  predictDisease: async (file: File) => {
    const response = await apiClient.post<
      ApiEnvelope<PredictResponse> | PredictResponse
    >(API_ENDPOINTS.DISEASES.PREDICT, toFormData(file), multipartConfig);
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
};
