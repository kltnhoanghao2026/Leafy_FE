import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { knowledgeBaseApi } from "../api/knowledgeBaseApi";
import type {
  IngestionResponse,
  PreviewResponse,
  DocumentSummary,
} from "../api/knowledgeBaseApi";
import { toast } from "react-hot-toast";

// ── Tasks ───────────────────────────────────────────────────────────────────

export function useKnowledgeBaseTasks() {
  return useQuery({
    queryKey: ["knowledge-base-tasks"],
    queryFn: knowledgeBaseApi.getTasks,
    refetchInterval: (data) => {
      // Poll every 3 seconds if any task is pending or processing
      const hasActiveTasks = Array.isArray(data) && data.some(
        (task) => task.status === "pending" || task.status === "processing"
      );
      return hasActiveTasks ? 3000 : false;
    },
  });
}

// ── Ingestion ───────────────────────────────────────────────────────────────

export function useIngestDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      category,
      variety,
    }: {
      file: File;
      category?: string;
      variety?: string;
    }) => knowledgeBaseApi.ingestDocument(file, category, variety),
    onSuccess: (data: IngestionResponse) => {
      if (data.status === "skipped") {
        toast.error("Tài liệu đã tồn tại trong hệ thống!");
      } else {
        toast.success("Tài liệu đang được xử lý!");
      }
      queryClient.invalidateQueries({ queryKey: ["knowledge-base-tasks"] });
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Tải lên tài liệu thất bại");
    },
  });
}

// ── Preview ─────────────────────────────────────────────────────────────────

export function usePreviewDocument() {
  return useMutation<PreviewResponse, Error, File>({
    mutationFn: (file: File) => knowledgeBaseApi.previewDocument(file),
    onError: (error: Error) => {
      toast.error(error?.message || "Không thể xem trước tài liệu");
    },
  });
}

// ── Document Catalog ────────────────────────────────────────────────────────

export function useDocuments() {
  return useQuery<DocumentSummary[]>({
    queryKey: ["knowledge-base-documents"],
    queryFn: () => knowledgeBaseApi.getDocuments(),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      knowledgeBaseApi.deleteDocument(documentId),
    onSuccess: () => {
      toast.success("Đã xóa tài liệu thành công!");
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base-documents"],
      });
    },
    onError: (error: Error) => {
      toast.error(error?.message || "Xóa tài liệu thất bại");
    },
  });
}
