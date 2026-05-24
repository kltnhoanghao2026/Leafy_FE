import { useNavigate } from "react-router-dom";
import {
  Award,
  ChevronRight,
  ShieldCheck,
  Clock,
  XCircle,
  ShieldOff,
} from "lucide-react";
import { useMyProfile } from "../queries";
import { certificatesQueries } from "../../certificates/queries/certificates.queries";
import { ROUTES } from "../../../lib/routes";
import { ROLE_LABELS } from "../types";
import { useTranslation } from "../../../i18n/useTranslation";
import type { CertificateStatus } from "../../certificates/types";

const STATUS_CONFIG: Record<
  CertificateStatus,
  { label: string; icon: typeof ShieldCheck; color: string; bg: string }
> = {
  APPROVED: {
    label: "Đã xác minh",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
  },
  PENDING: {
    label: "Đang chờ duyệt",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
  REJECTED: {
    label: "Bị từ chối",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
  },
  REVOKED: {
    label: "Đã thu hồi",
    icon: ShieldOff,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
  },
};

function StatusBadge({ status }: { status: CertificateStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.color}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

export function CertificateSettingsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: requests = [], isLoading: requestsLoading } =
    certificatesQueries.useMyApprovalRequests(profile?.id ?? "");

  const latestRequest = requests[0] ?? null;

  const handleClick = () => navigate(ROUTES.DASHBOARD.EXPERT_APPLICATION_HISTORY);
  const handleSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(ROUTES.DASHBOARD.APPLY_AS_EXPERT);
  };

  if (profileLoading || requestsLoading) {
    return (
      <section className="bg-[var(--app-card)] rounded-[24px] p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded-full w-36 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded-full w-24 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  const isExpert = profile?.role === "EXPERT";
  const hasPending = requests.some((r) => r.status === "PENDING");
  const hasApproved = requests.some((r) => r.status === "APPROVED");
  const hasRejectedOrRevoked =
    requests.some((r) => r.status === "REJECTED") ||
    requests.some((r) => r.status === "REVOKED");

  const displayStatus: CertificateStatus | null = hasApproved
    ? "APPROVED"
    : hasPending
      ? "PENDING"
      : latestRequest?.status === "REJECTED"
        ? "REJECTED"
        : latestRequest?.status === "REVOKED"
          ? "REVOKED"
          : null;

  return (
    <section
      className="bg-[var(--app-card)] rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
      role="button"
      aria-label={t("settings.certificate.viewHistory")}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
          </div>
          {displayStatus && (
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                displayStatus === "APPROVED"
                  ? "bg-emerald-500"
                  : displayStatus === "PENDING"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
            {t("settings.certificate.title")}
          </p>
          {isExpert ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status="APPROVED" />
              {profile?.specialty && (
                <span className="text-[12px] text-slate-400 truncate">
                  · {profile.specialty}
                </span>
              )}
            </div>
          ) : hasPending ? (
            <div className="mt-0.5">
              <StatusBadge status="PENDING" />
            </div>
          ) : hasRejectedOrRevoked && latestRequest ? (
            <div className="flex flex-col gap-1 mt-0.5">
              <StatusBadge status={latestRequest.status as CertificateStatus} />
              {latestRequest.rejectionReason && (
                <p className="text-[12px] text-slate-400 truncate">
                  {latestRequest.rejectionReason}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12px] font-semibold text-slate-400 mt-0.5">
              {t("settings.certificate.noHistory")}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0"
          strokeWidth={2.5}
        />
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between pl-[3.25rem]">
        {isExpert ? (
          <p className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {t("settings.certificate.verifiedBadge")}
          </p>
        ) : hasPending ? (
          <p className="text-[12px] font-semibold text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t("settings.certificate.pendingBadge")}
          </p>
        ) : hasRejectedOrRevoked ? (
          <p className="text-[12px] font-semibold text-red-500 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {t("settings.certificate.rejectedBadge")}
          </p>
        ) : null}

        {/* Action button (right-aligned) */}
        {!isExpert && !hasPending && (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            {t("settings.certificate.submitButton")}
          </button>
        )}
        {isExpert && (
          <p className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {t("settings.certificate.viewHistory")}
          </p>
        )}
      </div>
    </section>
  );
}
