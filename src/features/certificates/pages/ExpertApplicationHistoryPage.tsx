import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  ShieldOff,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { useMyProfile } from "../../settings/queries";
import { certificatesQueries } from "../queries/certificates.queries";
import { ROUTES } from "../../../lib/routes";
import type { ApprovalRequestDto, CertificateStatus } from "../types";

const STATUS_CONFIG: Record<
  CertificateStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    badge: string;
    description: string;
  }
> = {
  PENDING: {
    label: "Đang chờ duyệt",
    icon: Clock,
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    description: "Hồ sơ đang được đội ngũ quản trị xem xét.",
  },
  APPROVED: {
    label: "Đã phê duyệt",
    icon: ShieldCheck,
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    description:
      "Bạn đã trở thành Chuyên gia được xác minh! Giờ đây bạn có thể nhận yêu cầu tư vấn từ nông dân.",
  },
  REJECTED: {
    label: "Bị từ chối",
    icon: XCircle,
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
    description:
      "Hồ sơ chưa được chấp nhận. Vui lòng kiểm tra lý do và nộp lại.",
  },
  REVOKED: {
    label: "Đã thu hồi",
    icon: ShieldOff,
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    description:
      "Chứng chỉ đã bị thu hồi bởi quản trị viên.",
  },
};

function StatusBadge({ status }: { status: CertificateStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

function RequestCard({
  request,
  onViewHistory,
}: {
  request: ApprovalRequestDto;
  onViewHistory: () => void;
}) {
  const config = STATUS_CONFIG[request.status];
  const Icon = config.icon;
  const isPending = request.status === "PENDING";
  const certCount = request.certificates?.length ?? 0;

  const submittedAt = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {request.proposedSpecialty ?? "Hồ sơ chuyên gia"}
            </p>
            {submittedAt && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <CalendarDays className="w-3 h-3" strokeWidth={1.5} />
                Gửi ngày {submittedAt}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">
        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {config.description}
        </p>

        {/* Certificates summary */}
        {certCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-slate-700">
              {certCount} chứng chỉ đã gửi
            </span>
            <div className="flex items-center gap-1 ml-1">
              {request.certificates.slice(0, 4).map((cert, i) => (
                <span
                  key={i}
                  className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5"
                >
                  {cert.title}
                </span>
              ))}
              {certCount > 4 && (
                <span className="text-xs text-slate-400">+{certCount - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-xs font-bold text-red-600 mb-0.5">Lý do từ chối:</p>
              <p className="text-xs text-red-700 leading-relaxed">
                {request.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Revocation reason */}
        {request.status === "REVOKED" && request.rejectionReason && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <ShieldOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-xs font-bold text-amber-600 mb-0.5">Lý do thu hồi:</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {request.rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* CTA: Submit new application */}
        {(request.status === "REJECTED" || request.status === "REVOKED") && (
          <button
            onClick={onViewHistory}
            className="flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
            Nộp hồ sơ mới
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ExpertApplicationHistoryPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const { data: requests = [], isLoading, isError } = certificatesQueries.useMyApprovalRequests(
    profile?.id ?? "",
  );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const handleSubmitNew = () => {
    navigate(ROUTES.DASHBOARD.APPLY_AS_EXPERT);
  };

  return (
    <div className={embedded ? "" : "max-w-2xl mx-auto pb-20"}>
      {/* Header — hidden when embedded in profile tab */}
      {!embedded && (
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Lịch sử hồ sơ
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi tình trạng hồ sơ xác minh chuyên gia của bạn
            </p>
          </div>
          {/* Submit new button — only show if no pending request */}
          {!isLoading && pendingCount === 0 && (
            <button
              onClick={handleSubmitNew}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245A34] hover:bg-[#1a4226] text-white font-bold text-sm shadow-sm transition-colors"
            >
              <Award className="w-4 h-4" strokeWidth={2.5} />
              Nộp hồ sơ mới
            </button>
          )}
        </div>
      )}

      {/* Stats row */}
      {!isLoading && requests.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Đang chờ", count: pendingCount, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Đã duyệt", count: approvedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Bị từ chối", count: rejectedCount, color: "text-red-600", bg: "bg-red-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border border-slate-100 p-4 text-center ${stat.bg}`}
            >
              <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
          <XCircle className="w-5 h-5 shrink-0" strokeWidth={2} />
          <p className="text-sm font-medium">
            Không thể tải lịch sử hồ sơ. Vui lòng thử lại.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Award className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-700">
              Bạn chưa có hồ sơ nào
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Gửi hồ sơ chứng chỉ để trở thành Chuyên gia
            </p>
          </div>
          <button
            onClick={handleSubmitNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#245A34] hover:bg-[#1a4226] text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Award className="w-4 h-4" strokeWidth={2.5} />
            Nộp hồ sơ xác minh
          </button>
        </div>
      )}

      {/* Request list */}
      {!isLoading && !isError && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onViewHistory={handleSubmitNew}
            />
          ))}
        </div>
      )}
    </div>
  );
}
