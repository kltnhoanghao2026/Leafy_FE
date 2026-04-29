import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  Info,
  Clock,
  XCircle,
  UserCircle,
  ArrowUpRight,
  FileStack,
  ShieldOff,
  Loader2,
} from "lucide-react";
import {
  useAdminPendingApprovalRequests,
  useAdminProcessedApprovalRequests,
  useRevokeApprovalRequest,
} from "./certificates.queries";
import { ApprovalCard } from "./ApprovalCard";
import { SkeletonCard } from "./SkeletonCard";
import { CertificateItem } from "./CertificateItem";
import type { ApprovalRequestResponse } from "../types";
import { ROUTES } from "../../../lib/routes";

// ── Processed card ────────────────────────────────────────────────────────────

function ProcessedApprovalCard({
  request,
}: {
  request: ApprovalRequestResponse;
}) {
  const certCount = request.certificates.length;
  const isApproved = request.status === "APPROVED";
  const isRevoked = request.status === "REVOKED";

  const [showRevokeForm, setShowRevokeForm] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const revoke = useRevokeApprovalRequest();

  const handleRevoke = () => {
    revoke.mutate(
      {
        profileId: request.profileId,
        requestId: request.id,
        reason: revokeReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowRevokeForm(false);
          setRevokeReason("");
        },
      },
    );
  };

  const statusBadge = isApproved ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shrink-0">
      <BadgeCheck className="w-3 h-3" strokeWidth={2.5} />
      Đã phê duyệt
    </span>
  ) : isRevoked ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 shrink-0">
      <ShieldOff className="w-3 h-3" strokeWidth={2.5} />
      Đã thu hồi
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-200 shrink-0">
      <XCircle className="w-3 h-3" strokeWidth={2.5} />
      Đã từ chối
    </span>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
            {request.userInfo?.avatar || request.userInfo?.profilePicture ? (
              <img
                src={
                  request.userInfo.avatar ??
                  request.userInfo.profilePicture ??
                  undefined
                }
                alt={request.userInfo.fullName ?? "avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle
                className="w-5 h-5 text-emerald-600"
                strokeWidth={1.5}
              />
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={ROUTES.ADMIN.PROFILE_DETAIL(request.profileId)}
              className="inline-flex items-center gap-1 text-sm font-bold text-slate-800 hover:text-emerald-700 transition-colors"
            >
              {request.userInfo?.fullName ??
                `Hồ sơ #${request.profileId.slice(-10)}`}
              <ArrowUpRight
                className="w-3.5 h-3.5 opacity-50"
                strokeWidth={2.5}
              />
            </Link>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {request.userInfo?.email && (
                <p className="text-xs text-slate-400">
                  {request.userInfo.email}
                </p>
              )}
              {request.userInfo?.role && (
                <span className="text-xs text-slate-400 font-mono">
                  · {request.userInfo.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {statusBadge}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px]">
        {/* Left — certificate list (read-only) */}
        <div className="divide-y divide-slate-100 px-6 py-2 min-w-0">
          {certCount === 0 ? (
            <p className="py-10 text-sm text-slate-400 text-center">
              Không có chứng chỉ nào trong yêu cầu này
            </p>
          ) : (
            request.certificates.map((cert, idx) => (
              <CertificateItem key={cert.id} cert={cert} index={idx + 1} />
            ))
          )}
        </div>

        {/* Right — result sidebar */}
        <div className="lg:border-l border-t lg:border-t-0 border-slate-100 bg-slate-50/60 px-5 py-5 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Tóm tắt yêu cầu
            </p>
            <div className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 flex items-center gap-2.5">
              <FileStack
                className="w-4 h-4 text-slate-400 shrink-0"
                strokeWidth={1.5}
              />
              <span className="text-sm text-slate-600">
                <span className="font-bold text-slate-800">{certCount}</span>{" "}
                chứng chỉ
              </span>
            </div>
            {request.proposedSpecialty && (
              <div className="mt-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5 flex items-start gap-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">
                  Chuyên môn
                </span>
                <span className="text-sm text-slate-700 font-medium leading-snug wrap-break-word">
                  {request.proposedSpecialty}
                </span>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-200" />

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Kết quả
            </p>
            {isApproved ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                  <BadgeCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
                  Yêu cầu đã được phê duyệt
                </div>
                {showRevokeForm ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Lý do thu hồi (tùy chọn)…"
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRevoke}
                        disabled={revoke.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                      >
                        {revoke.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldOff
                            className="w-3.5 h-3.5"
                            strokeWidth={2.5}
                          />
                        )}
                        Xác nhận thu hồi
                      </button>
                      <button
                        onClick={() => {
                          setShowRevokeForm(false);
                          setRevokeReason("");
                        }}
                        disabled={revoke.isPending}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-semibold text-slate-600 transition-colors"
                      >
                        Huỷ
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRevokeForm(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-colors"
                  >
                    <ShieldOff className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Thu hồi chứng chỉ
                  </button>
                )}
              </div>
            ) : isRevoked ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                  <ShieldOff className="w-4 h-4 shrink-0" strokeWidth={2} />
                  Chứng chỉ đã bị thu hồi
                </div>
                {request.rejectionReason && (
                  <div className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-500 block mb-1">
                      Lý do:
                    </span>
                    {request.rejectionReason}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                  <XCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                  Yêu cầu đã bị từ chối
                </div>
                {request.rejectionReason && (
                  <div className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-500 block mb-1">
                      Lý do:
                    </span>
                    {request.rejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CertificateApprovalPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "processed">(
    "pending",
  );

  const {
    data: pendingRequests,
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
  } = useAdminPendingApprovalRequests();

  const {
    data: processedRequests,
    isLoading: isProcessedLoading,
    isError: isProcessedError,
    error: processedError,
  } = useAdminProcessedApprovalRequests();

  const pendingCount = pendingRequests?.length ?? 0;
  const processedCount = processedRequests?.length ?? 0;

  const isLoading =
    activeTab === "pending" ? isPendingLoading : isProcessedLoading;
  const isError = activeTab === "pending" ? isPendingError : isProcessedError;
  const error = activeTab === "pending" ? pendingError : processedError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-800">
              Phê duyệt Chứng chỉ
            </h1>
            {!isPendingLoading && !isPendingError && pendingCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {pendingCount} đang chờ
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Xem xét và phê duyệt các yêu cầu chứng chỉ của người dùng
          </p>
        </div>
        <BadgeCheck
          className="w-9 h-9 text-emerald-600 shrink-0 mt-0.5"
          strokeWidth={1.5}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("pending")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          Đang chờ
          {!isPendingLoading && pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("processed")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "processed"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          Đã xử lý
          {!isProcessedLoading && processedCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
              {processedCount}
            </span>
          )}
        </button>
      </div>

      {/* Tip — only on pending tab with items */}
      {activeTab === "pending" &&
        !isPendingLoading &&
        !isPendingError &&
        pendingCount > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
            <Info className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs leading-relaxed">
              Xem trước bằng chứng trực tiếp trong từng yêu cầu. Nhấn vào xem
              trước để mở toàn màn hình trước khi ra quyết định.
            </p>
          </div>
        )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2} />
          <p className="text-sm font-medium">
            Không thể tải danh sách yêu cầu
            {(error as Error)?.message ? `: ${(error as Error).message}` : ""}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Pending tab content */}
      {activeTab === "pending" && !isPendingLoading && !isPendingError && (
        <>
          {pendingCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <BadgeCheck
                  className="w-8 h-8 text-emerald-500"
                  strokeWidth={1.5}
                />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-700">
                  Không có yêu cầu nào đang chờ
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Tất cả yêu cầu chứng chỉ đã được xử lý
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {pendingRequests!.map((req) => (
                <ApprovalCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Processed tab content */}
      {activeTab === "processed" &&
        !isProcessedLoading &&
        !isProcessedError && (
          <>
            {processedCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <BadgeCheck
                    className="w-8 h-8 text-slate-400"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-700">
                    Chưa có yêu cầu nào đã xử lý
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Các yêu cầu đã phê duyệt hoặc từ chối sẽ hiển thị ở đây
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {processedRequests!.map((req) => (
                  <ProcessedApprovalCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}
