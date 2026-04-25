import {
  FileText,
  Trash2,
  Layers,
  Calendar,
  Tag,
  Database,
  ExternalLink,
} from "lucide-react";
import type { DocumentSummary } from "../api/knowledgeBaseApi";
import { useDeleteDocument } from "../hooks/useKnowledgeBase";
import { useState } from "react";
import { AdminTable } from "../../../../components/admin/AdminTable";

interface DocumentsCatalogProps {
  documents: DocumentSummary[];
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_60px] gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-200 rounded w-48" />
          <div className="h-2.5 bg-slate-100 rounded w-32" />
        </div>
      </div>
      <div className="h-4 bg-slate-100 rounded w-20" />
      <div className="h-4 bg-slate-100 rounded w-16" />
      <div className="h-6 bg-slate-100 rounded-full w-24" />
      <div className="flex justify-end">
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}

const SECTION_COLORS: Record<string, string> = {
  summary: "bg-violet-100 text-violet-700",
  methodology: "bg-blue-100 text-blue-700",
  results: "bg-amber-100 text-amber-700",
  general: "bg-slate-100 text-slate-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  agronomy: "Nông học",
  regulation: "Quy định",
  disease: "Bệnh hại",
  other: "Khác",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function DeleteConfirmDialog({
  filename,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  filename: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
        <p className="text-sm text-slate-600 mb-1">
          Bạn chắc chắn muốn xóa tài liệu này?
        </p>
        <p className="text-sm font-semibold text-slate-800 mb-4 truncate">
          "{filename}"
        </p>
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mb-4">
          Hành động này sẽ xóa tài liệu khỏi Qdrant, MongoDB và danh mục.
          Không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xóa…
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DocumentsCatalog({
  documents,
  isLoading,
}: DocumentsCatalogProps) {
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();
  const [deleteTarget, setDeleteTarget] = useState<DocumentSummary | null>(
    null
  );

  return (
    <>
      <AdminTable
        gridCols="grid-cols-[1fr_120px_100px_120px_60px]"
        columns={[
          { label: "Tài liệu" },
          { label: "Kích thước" },
          { label: "Chunks" },
          { label: "Trạng thái" },
          { label: "", align: "right" },
        ]}
        isLoading={isLoading}
        isEmpty={documents.length === 0}
        emptyMessage="Chưa có tài liệu nào được nhập vào hệ thống."
        emptyIcon={<Database className="w-8 h-8" />}
        renderSkeleton={() => <SkeletonRow />}
        skeletonCount={5}
      >
        {documents.map((doc) => (
          <div
            key={doc.document_id}
            className="grid grid-cols-[1fr_120px_100px_120px_60px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group"
          >
            {/* Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 p-2 bg-emerald-50 text-emerald-600 rounded-lg ring-1 ring-emerald-100/50">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {doc.original_filename}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(doc.ingested_at)}
                  </span>
                  {doc.category && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {CATEGORY_LABELS[doc.category] || doc.category}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="text-sm text-slate-600">
              {formatFileSize(doc.file_size)}
            </div>

            {/* Chunks */}
            <div className="text-sm text-slate-600">
              {doc.chunk_count}
            </div>

            {/* Status */}
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
                  doc.status === "ingested"
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/50"
                    : "bg-rose-50 text-rose-700 ring-1 ring-rose-100/50"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${doc.status === "ingested" ? "bg-emerald-500" : "bg-rose-500"}`} />
                {doc.status === "ingested" ? "Đã nhập" : "Lỗi"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteTarget(doc)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Xóa tài liệu"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </AdminTable>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          filename={deleteTarget.original_filename}
          isDeleting={isDeleting}
          onConfirm={() => {
            deleteDoc(deleteTarget.document_id, {
              onSuccess: () => setDeleteTarget(null),
            });
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
