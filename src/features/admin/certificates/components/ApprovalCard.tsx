import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  UserCircle,
  Clock,
  FileStack,
  ArrowUpRight,
} from "lucide-react";
import type { ApprovalRequestDto } from "../../types";
import { useUpdateApprovalStatus } from "../certificates.queries";
import { CertificateItem } from "./CertificateItem";
import { ROUTES } from "../../../../lib/routes";

export function ApprovalCard({ request }: { request: ApprovalRequestDto }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useUpdateApprovalStatus();

  const isPendingApprove =
    mutation.isPending &&
    (mutation.variables as { requestId: string } | undefined)?.requestId ===
      request.id &&
    mutation.variables?.payload?.status === "APPROVED";

  const isPendingReject =
    mutation.isPending &&
    (mutation.variables as { requestId: string } | undefined)?.requestId ===
      request.id &&
    mutation.variables?.payload?.status === "REJECTED";

  function handleApprove() {
    mutation.mutate({
      profileId: request.profileId,
      requestId: request.id,
      payload: { status: "APPROVED" },
    });
  }

  function handleRejectConfirm() {
    if (!reason.trim()) return;
    mutation.mutate(
      {
        profileId: request.profileId,
        requestId: request.id,
        payload: { status: "REJECTED", reason: reason.trim() },
      },
      {
        onSuccess: () => {
          setRejecting(false);
          setReason("");
        },
      },
    );
  }

  const certCount = request.certificates.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
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

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 shrink-0">
          <Clock className="w-3 h-3" strokeWidth={2.5} />
          Đang chờ duyệt
        </span>
      </div>

      {/* ── Body: evidence (left) + decision sidebar (right) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px]">
        {/* Left ── certificate list */}
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

        {/* Right ── decision sidebar */}
        <div className="lg:border-l border-t lg:border-t-0 border-slate-100 bg-slate-50/60 px-5 py-5 flex flex-col gap-5">
          {/* Summary */}
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
                chứng chỉ cần xem xét
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

          {/* Decision */}
          <div className="flex-1 flex flex-col gap-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Quyết định
            </p>

            {!rejecting ? (
              <>
                <button
                  onClick={handleApprove}
                  disabled={mutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isPendingApprove ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                  )}
                  Phê duyệt
                </button>
                <button
                  onClick={() => setRejecting(true)}
                  disabled={mutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" strokeWidth={2.5} />
                  Từ chối
                </button>
              </>
            ) : (
              <div className="space-y-2.5">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Nhập lý do từ chối (bắt buộc)..."
                  autoFocus
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-shadow resize-none"
                />
                <button
                  onClick={handleRejectConfirm}
                  disabled={!reason.trim() || mutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isPendingReject ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" strokeWidth={2.5} />
                  )}
                  Xác nhận từ chối
                </button>
                <button
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  disabled={mutation.isPending}
                  className="w-full px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-200/80 transition-colors"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
