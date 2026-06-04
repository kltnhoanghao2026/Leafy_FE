import type { ApiEnvelope } from "../../shared/types/api";
import type { FileResponse } from "../../features/settings/types";
import apiClient from "../apiClient";
import { API_ENDPOINTS } from "../routes";

const ABSOLUTE_OR_BROWSER_URL_PATTERN = /^(https?:|data:|blob:|\/)/i;
const INTERNAL_FILE_DOWNLOAD_PATTERN = /\/internal\/files\/download\/s3-key(?:\?|$)/i;

export const isFileServiceReference = (
  value: string | null | undefined,
): value is string =>
  Boolean(value && (!ABSOLUTE_OR_BROWSER_URL_PATTERN.test(value) || isInternalFileDownloadUrl(value)));

const isInternalFileDownloadUrl = (value: string) =>
  INTERNAL_FILE_DOWNLOAD_PATTERN.test(value);

const extractInternalDownloadS3Key = (value: string): string | null => {
  if (!isInternalFileDownloadUrl(value)) {
    return null;
  }

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, window.location.origin);
    return url.searchParams.get("s3Key");
  } catch {
    const [, query = ""] = value.split("?");
    return new URLSearchParams(query).get("s3Key");
  }
};

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

  async getPresignedUrl(fileReference: string): Promise<string> {
    const internalS3Key = extractInternalDownloadS3Key(fileReference);
    let fileId = fileReference;

    if (internalS3Key) {
      const fileResponse = await apiClient.get<ApiEnvelope<FileResponse>>(
        API_ENDPOINTS.FILES.BY_S3_KEY(internalS3Key),
      );

      if (!fileResponse.data.data?.id) {
        throw new Error(fileResponse.data.message || "File metadata is unavailable");
      }

      fileId = fileResponse.data.data.id;
    }

    const response = await apiClient.get<ApiEnvelope<string>>(
      API_ENDPOINTS.FILES.PRESIGNED_URL(fileId),
    );

    if (!response.data.data) {
      throw new Error(response.data.message || "File URL is unavailable");
    }

    return response.data.data;
  },
  async uploadFileDirectToS3(file: File): Promise<FileResponse> {
    // 1. Get presigned URL
    const presignedResponse = await apiClient.get<
      ApiEnvelope<{ s3Key: string; presignedUrl: string }>
    >(API_ENDPOINTS.FILES.PRESIGNED_UPLOAD_URL, {
      params: {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      },
    });

    if (!presignedResponse.data.data) {
      throw new Error(
        presignedResponse.data.message || "Failed to get presigned upload URL",
      );
    }

    const { s3Key, presignedUrl } = presignedResponse.data.data;

    // 2. Upload file directly to S3
    const uploadResult = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadResult.ok) {
      throw new Error(`Failed to upload file to S3: ${uploadResult.statusText}`);
    }

    // 3. Create file metadata in our backend
    const createResponse = await apiClient.post<ApiEnvelope<FileResponse>>(
      API_ENDPOINTS.FILES.CREATE,
      {
        s3Key,
        originalFileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      },
    );

    if (!createResponse.data.data) {
      throw new Error(
        createResponse.data.message || "Failed to create file metadata",
      );
    }

    return createResponse.data.data;
  },
};
