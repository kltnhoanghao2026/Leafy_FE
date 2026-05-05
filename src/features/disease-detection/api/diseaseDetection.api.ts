import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

interface ApiResponseEnvelope<T> {
  code: number;
  message: string;
  data: T | null; // Using 'data' based on Leafy_APP's approach
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LeafDetection {
  className: string;
  confidenceScore: number;
  boundingBox: BoundingBox;
}

export interface LeafDetectionResponse {
  detections: LeafDetection[];
  modelName: string;
  imageWidth: number;
  imageHeight: number;
  processingTimeMs: number | null;
  detectionCount: number;
}

export interface PredictionResult {
  className: string;
  confidenceScore: number;
}

export interface PredictionResponse {
  predictions: PredictionResult[];
  modelName: string;
  processingTimeMs: number | null;
}

export const diseaseDetectionApi = {
  detectLeaf: async (file: File): Promise<LeafDetectionResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponseEnvelope<LeafDetectionResponse>>(
      API_ENDPOINTS.DISEASES.DETECT_LEAF,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      }
    );

    if (!response.data || (!response.data.data && !(response.data as any).detections)) {
      throw new Error("Invalid response format");
    }
    
    const payload = response.data as any;
    const result = payload.result || payload.data || payload; 
    
    return result as LeafDetectionResponse;
  },

  predict: async (file: File | Blob): Promise<PredictionResponse> => {
    const formData = new FormData();
    // Ensure Blob gets a generic filename if not a File
    formData.append("file", file, file instanceof File ? file.name : "cropped_leaf.jpg");

    const response = await apiClient.post<ApiResponseEnvelope<PredictionResponse>>(
      API_ENDPOINTS.DISEASES.PREDICT,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      }
    );

    if (!response.data || (!response.data.data && !(response.data as any).predictions)) {
      throw new Error("Invalid response format");
    }
    
    const payload = response.data as any;
    const result = payload.result || payload.data || payload; 
    
    return result as PredictionResponse;
  },
};
