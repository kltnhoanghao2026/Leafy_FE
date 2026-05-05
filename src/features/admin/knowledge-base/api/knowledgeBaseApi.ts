import apiClient from "../../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../../lib/routes";

// â”€â”€ Ingestion Task Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface IngestionTaskInfo {
  original_filename?: string;
  content_type?: string;
  category?: string;
  variety?: string;
  user_id?: string;
}

export interface IngestionTask {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  message: string | null;
  file_info: IngestionTaskInfo | null;
  error: string | null;
}

export interface IngestionResponse {
  task_id: string;
  status: string;
  message: string;
  file_id: string | null;
}

// â”€â”€ Chunk Preview Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ChunkPreview {
  index: number;
  text: string;
  section: string;
  element_type: string;
}

export interface PreviewResponse {
  filename: string;
  total_chunks: number;
  sections: string[];
  chunks: ChunkPreview[];
}

// â”€â”€ Document Catalog Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface DocumentSummary {
  document_id: string;
  original_filename: string;
  content_type: string | null;
  file_size: number | null;
  category: string | null;
  variety: string | null;
  user_id: string | null;
  file_service_id: string | null;
  file_service_s3_key: string | null;
  chunk_count: number;
  sections: string[];
  status: string;
  ingested_at: string | null;
}

export interface DocumentDetail extends DocumentSummary {
  chunks: ChunkPreview[];
}

// â”€â”€ API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const knowledgeBaseApi = {
  // â”€â”€ Ingestion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  ingestDocument: async (
    file: File,
    category?: string,
    variety?: string
  ): Promise<IngestionResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (category) formData.append("category", category);
    if (variety) formData.append("variety", variety);

    const response = await apiClient.post(API_ENDPOINTS.RAG.INGEST, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.result || response.data.data;
  },

  // â”€â”€ Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  previewDocument: async (file: File): Promise<PreviewResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      API_ENDPOINTS.RAG.PREVIEW,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.result || response.data.data;
  },

  // â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getTasks: async (): Promise<IngestionTask[]> => {
    const response = await apiClient.get(API_ENDPOINTS.RAG.TASKS);
    return response.data.result || response.data.data || [];
  },

  getTaskStatus: async (taskId: string): Promise<IngestionTask> => {
    const response = await apiClient.get(API_ENDPOINTS.RAG.TASK(taskId));
    return response.data.result || response.data.data;
  },

  // â”€â”€ Document Catalog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getDocuments: async (
    skip = 0,
    limit = 50
  ): Promise<DocumentSummary[]> => {
    const response = await apiClient.get(API_ENDPOINTS.RAG.DOCUMENTS, {
      params: { skip, limit },
    });
    return response.data.result || response.data.data || [];
  },

  getDocument: async (documentId: string): Promise<DocumentDetail> => {
    const response = await apiClient.get(
      API_ENDPOINTS.RAG.DOCUMENT(documentId)
    );
    return response.data.result || response.data.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.RAG.DOCUMENT(documentId));
  },
};
