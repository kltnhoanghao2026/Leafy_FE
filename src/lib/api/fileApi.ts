import type { ApiEnvelope } from "../../shared/types/api";
import type { FileResponse } from "../../features/settings/types";
import apiClient from "../apiClient";
import { API_ENDPOINTS } from "../routes";

const ABSOLUTE_OR_BROWSER_URL_PATTERN = /^(https?:|data:|blob:|\/)/i;

export const isFileServiceReference = (
  value: string | null | undefined,
): value is string => Boolean(value && !ABSOLUTE_OR_BROWSER_URL_PATTERN.test(value));

export const fileApi = {
  async uploadFile(file: File): Promise<FileResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiEnvelope<FileResponse>>(
      API_ENDPOINTS.FILES.UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    if (!response.data.data) {
      throw new Error(response.data.message || "File upload failed");
    }

    return response.data.data;
  },

  async getPresignedUrl(fileId: string): Promise<string> {
    const response = await apiClient.get<ApiEnvelope<string>>(
      API_ENDPOINTS.FILES.PRESIGNED_URL(fileId),
    );

    if (!response.data.data) {
      throw new Error(response.data.message || "File URL is unavailable");
    }

    return response.data.data;
  },
};
