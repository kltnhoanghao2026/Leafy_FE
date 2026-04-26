import { useState } from "react";
import {
  RefreshCw,
  UserCheck,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  TriangleAlert,
  Play,
  RotateCcw,
  Bug,
  ChevronDown,
  ChevronUp,
  RotateCw,
  CheckCheck,
} from "lucide-react";
import {
  useStartProfileSync,
  useResumeProfileSync,
  useProfileSyncStatus,
  useReindexProfiles,
  useResetProfileIndex,
  useReindexPosts,
  useResetPostIndex,
  useFailedEvents,
  useFailedEventsCount,
  useResolveFailedEvent,
  useRetryFailedEvent,
  useRetryAllFailedEvents,
} from "../";
import type { SyncTaskStatus } from "../";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SyncTaskStatus }) {
  const map: Record<
    SyncTaskStatus,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    STARTING: {
      label: "Đang khởi động",
      className: "bg-blue-100 text-blue-700",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    RUNNING: {
      label: "Đang chạy",
      className: "bg-amber-100 text-amber-700",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    COMPLETED: {
      label: "Hoàn thành",
      className: "bg-emerald-100 text-emerald-700",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    FAILED: {
      label: "Thất bại",
      className: "bg-red-100 text-red-700",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const { label, className, icon } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

function ConfirmBanner({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2 text-sm text-amber-800">
        <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>{message}</span>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        >
          Huỷ
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1 text-xs rounded-md bg-amber-600 text-white hover:bg-amber-700 font-medium"
        >
          Xác nhận xoá & khởi tạo lại
        </button>
      </div>
    </div>
  );
}

// ── Profile Sync Card ────────────────────────────────────────────────────────

function ProfileSyncCard() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: syncStatus, isFetching } = useProfileSyncStatus(taskId);
  const startSync = useStartProfileSync();
  const resumeSync = useResumeProfileSync();
  
  const reindexProfiles = useReindexProfiles();
  const resetProfileIndex = useResetProfileIndex();

  const isActive =
    syncStatus?.status === "STARTING" || syncStatus?.status === "RUNNING";

  const handleStart = () => {
    startSync.mutate(undefined, {
      onSuccess: (res) => {
        const id = res.data.data?.taskId;
        if (id) setTaskId(id);
      },
    });
  };

  const handleResume = () => {
    if (!taskId) return;
    resumeSync.mutate(taskId, {
      onSuccess: (res) => {
        const id = res.data.data?.taskId;
        if (id) setTaskId(id);
      },
    });
  };

  const handleReset = () => {
    resetProfileIndex.mutate(undefined, {
      onSuccess: () => setShowResetConfirm(false),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 shrink-0">
          <UserCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">
            Đồng bộ hồ sơ người dùng
          </h3>
          <p className="text-xs text-slate-500">
            Tái lập chỉ mục hồ sơ từ profile-service vào Elasticsearch
          </p>
        </div>
        {syncStatus && (
          <div className="ml-auto">
            <StatusBadge status={syncStatus.status} />
          </div>
        )}
      </div>

      {syncStatus && (
        <div className="flex flex-col gap-2">
          {(syncStatus.status === "STARTING" ||
            syncStatus.status === "RUNNING") && (
            <ProgressBar value={syncStatus.progressPercent} />
          )}
          {syncStatus.status === "COMPLETED" && <ProgressBar value={100} />}
          <div className="flex flex-col gap-0.5">
            <StatRow
              label="Đã xử lý (qua Kafka)"
              value={`${syncStatus.processedCount.toLocaleString()} / ${syncStatus.totalCount.toLocaleString()}`}
            />
            <StatRow
              label="Tiến độ"
              value={`${syncStatus.progressPercent.toFixed(1)}%`}
            />
            {syncStatus.taskId && (
              <StatRow label="Task ID" value={syncStatus.taskId} />
            )}
          </div>
          {syncStatus.status === "FAILED" && syncStatus.errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {syncStatus.errorMessage}
            </div>
          )}
        </div>
      )}

      {showResetConfirm && (
        <ConfirmBanner
          message="Thao tác này sẽ xoá toàn bộ chỉ mục hồ sơ hiện tại và bắt đầu lại từ đầu. Không thể hoàn tác."
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleStart}
          disabled={startSync.isPending || isActive}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {startSync.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Đồng bộ ngầm (Kafka)
        </button>

        <button
          onClick={() => reindexProfiles.mutate(undefined)}
          disabled={reindexProfiles.isPending || resetProfileIndex.isPending || isActive}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-600 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reindexProfiles.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Tái lập chỉ mục trực tiếp
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={
            reindexProfiles.isPending ||
            resetProfileIndex.isPending ||
            showResetConfirm ||
            isActive
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetProfileIndex.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TriangleAlert className="w-4 h-4" />
          )}
          Xoá & khởi tạo lại
        </button>

        {taskId && syncStatus?.status === "FAILED" && (
          <button
            onClick={handleResume}
            disabled={resumeSync.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resumeSync.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Tiếp tục tác vụ
          </button>
        )}

        {isActive && isFetching && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 self-center">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang cập nhật...
          </span>
        )}
      </div>
    </div>
  );
}

// ── Post Sync Card ───────────────────────────────────────────────────────────

function PostSyncCard() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const reindexPosts = useReindexPosts();
  const resetPostIndex = useResetPostIndex();

  const handleReset = () => {
    resetPostIndex.mutate(undefined, {
      onSuccess: () => setShowResetConfirm(false),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 shrink-0">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">
            Đồng bộ bài viết cộng đồng
          </h3>
          <p className="text-xs text-slate-500">
            Tái lập hoặc xoá và khởi tạo lại chỉ mục bài viết trong
            Elasticsearch
          </p>
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmBanner
          message="Thao tác này sẽ xoá toàn bộ chỉ mục bài viết hiện tại và bắt đầu lại từ đầu. Không thể hoàn tác."
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => reindexPosts.mutate(undefined)}
          disabled={reindexPosts.isPending || resetPostIndex.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reindexPosts.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Tái lập chỉ mục
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={
            reindexPosts.isPending ||
            resetPostIndex.isPending ||
            showResetConfirm
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 bg-white text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetPostIndex.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TriangleAlert className="w-4 h-4" />
          )}
          Xoá & khởi tạo lại
        </button>
      </div>
    </div>
  );
}

// ── Failed Events Card ───────────────────────────────────────────────────────

function FailedEventsCard() {
  const [page, setPage] = useState(0);
  const [showResolved, setShowResolved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 10;

  const { data: eventsPage, isLoading } = useFailedEvents({
    resolved: showResolved ? undefined : false,
    page,
    size: pageSize,
  });
  const { data: unresolvedCount = 0 } = useFailedEventsCount(false);
  const resolveEvent = useResolveFailedEvent();
  const retryEvent = useRetryFailedEvent();
  const retryAll = useRetryAllFailedEvents();

  const events = eventsPage?.content ?? [];
  const totalPages = eventsPage?.totalPages ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 shrink-0">
          <Bug className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-800">Sự kiện Kafka lỗi</h3>
            {unresolvedCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                {unresolvedCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Các sự kiện Kafka không xử lý được (Dead Letter Queue)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded"
              checked={showResolved}
              onChange={(e) => {
                setShowResolved(e.target.checked);
                setPage(0);
              }}
            />
            Hiện đã xử lý
          </label>
          <button
            onClick={() => retryAll.mutate()}
            disabled={retryAll.isPending || unresolvedCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retryAll.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
            Gửi lại tất cả
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
          <CheckCircle2 className="w-8 h-8 opacity-40" />
          <p className="text-sm">Không có sự kiện lỗi nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500 text-left">
                <th className="pb-2 pr-3 font-medium">Loại sự kiện</th>
                <th className="pb-2 pr-3 font-medium">Topic</th>
                <th className="pb-2 pr-3 font-medium text-center">Thử lại</th>
                <th className="pb-2 pr-3 font-medium">Trạng thái</th>
                <th className="pb-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <>
                  <tr
                    key={event.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === event.id ? null : event.id)
                    }
                  >
                    <td className="py-2 pr-3 font-mono text-xs text-slate-700">
                      <div className="flex items-center gap-1">
                        {expandedId === event.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {event.eventType}
                      </div>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">
                      {event.topic}
                    </td>
                    <td className="py-2 pr-3 text-center text-xs font-semibold text-slate-700">
                      {event.retryCount}
                    </td>
                    <td className="py-2 pr-3">
                      {event.resolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Lỗi
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div
                        className="inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!event.resolved && (
                          <>
                            <button
                              onClick={() => retryEvent.mutate(event.id)}
                              disabled={retryEvent.isPending}
                              title="Gửi lại"
                              className="p-1 rounded hover:bg-amber-100 text-amber-600 disabled:opacity-50"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => resolveEvent.mutate(event.id)}
                              disabled={resolveEvent.isPending}
                              title="Đánh dấu đã xử lý"
                              className="p-1 rounded hover:bg-emerald-100 text-emerald-600 disabled:opacity-50"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <tr key={`${event.id}-expanded`} className="bg-slate-50">
                      <td colSpan={5} className="px-4 pb-3 pt-1">
                        <div className="flex flex-col gap-2">
                          {event.errorMessage && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">
                                Lỗi
                              </p>
                              <p className="text-xs text-red-700 bg-red-50 rounded p-2 font-mono break-all">
                                {event.errorMessage}
                              </p>
                            </div>
                          )}
                          {event.payload && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-1">
                                Payload
                              </p>
                              <pre className="text-xs text-slate-700 bg-slate-100 rounded p-2 overflow-x-auto">
                                {event.payload}
                              </pre>
                            </div>
                          )}
                          <p className="text-xs text-slate-400">
                            Partition: {event.partition} · Offset:{" "}
                            {event.offset} · ID: {event.id}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 text-xs rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-xs text-slate-500">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 text-xs rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DataSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đồng bộ dữ liệu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý quá trình đồng bộ hồ sơ người dùng và bài viết cộng đồng vào
          chỉ mục tìm kiếm Elasticsearch.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ProfileSyncCard />
        <PostSyncCard />
      </div>

      <FailedEventsCard />
    </div>
  );
}
