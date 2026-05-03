import type { IngestionTask } from "../api/knowledgeBaseApi";
import { CheckCircle2, Clock, FileText, Loader2, XCircle } from "lucide-react";
import { AdminTable } from "../../../../components/admin/AdminTable";

interface IngestionTasksListProps {
  tasks: IngestionTask[];
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_120px_160px_130px] gap-4 items-center px-4 py-3 animate-pulse border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-slate-200 rounded w-48" />
          <div className="h-2.5 bg-slate-100 rounded w-64" />
        </div>
      </div>
      <div className="h-4 bg-slate-100 rounded w-20" />
      <div className="h-4 bg-slate-100 rounded w-32" />
      <div className="h-6 bg-slate-100 rounded-full w-24" />
    </div>
  );
}

export function IngestionTasksList({ tasks, isLoading }: IngestionTasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FileText className="w-12 h-12 mb-3 text-slate-300" />
        <p>Chưa có tài liệu nào được xử lý.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <AdminTable
      gridCols="grid-cols-[1fr_120px_160px_130px]"
      columns={[
        { label: "Tác vụ / Thông báo" },
        { label: "ID" },
        { label: "Thời gian tạo" },
        { label: "Trạng thái" },
      ]}
      isLoading={isLoading}
      isEmpty={tasks.length === 0}
      emptyMessage="Chưa có tài liệu nào được xử lý."
      emptyIcon={<FileText className="w-8 h-8" />}
      renderSkeleton={() => <SkeletonRow />}
      skeletonCount={5}
    >
      {tasks.map((task) => (
        <div
          key={task.task_id}
          className="grid grid-cols-[1fr_120px_160px_130px] gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors group"
        >
          {/* Info */}
          <div className="flex items-start gap-3 min-w-0 py-1">
            <div className={`shrink-0 p-1.5 rounded-lg ring-1 mt-0.5 ${
               task.status === "completed" ? "bg-emerald-50 text-emerald-600 ring-emerald-100/50" :
               task.status === "processing" ? "bg-blue-50 text-blue-600 ring-blue-100/50" :
               task.status === "failed" ? "bg-rose-50 text-rose-600 ring-rose-100/50" :
               "bg-amber-50 text-amber-600 ring-amber-100/50"
            }`}>
              {task.status === "pending" && <Clock className="w-4 h-4" />}
              {task.status === "processing" && <Loader2 className="w-4 h-4 animate-spin" />}
              {task.status === "completed" && <CheckCircle2 className="w-4 h-4" />}
              {task.status === "failed" && <XCircle className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-[13px] truncate">
                {task.file_info?.original_filename || "Không rõ tên tài liệu"}
              </p>
              <div className="mt-1 space-y-1">
                <p className="text-[12px] text-slate-500 line-clamp-1">
                  {task.message || "Đang chờ xử lý..."}
                </p>
                {task.error && (
                  <p className="text-[11px] text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100 inline-block">
                    {task.error}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ID */}
          <div className="text-[13px] font-mono text-slate-500">
            {task.task_id.substring(0, 8)}...
          </div>

          {/* Time */}
          <div className="text-[13px] text-slate-600">
            {formatDate(task.created_at)}
          </div>

          {/* Status */}
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                task.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100/50"
                  : task.status === "processing"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100/50"
                  : task.status === "failed"
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100/50"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-100/50"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                task.status === "completed" ? "bg-emerald-500" :
                task.status === "processing" ? "bg-blue-500 animate-pulse" :
                task.status === "failed" ? "bg-rose-500" :
                "bg-amber-500"
              }`} />
              {task.status === "completed"
                ? "Hoàn thành"
                : task.status === "processing"
                ? "Đang xử lý"
                : task.status === "failed"
                ? "Thất bại"
                : "Chờ xử lý"}
            </span>
          </div>
        </div>
      ))}
    </AdminTable>
  );
}
