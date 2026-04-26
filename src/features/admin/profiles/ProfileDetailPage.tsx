import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  Unlock,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Award,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Tractor,
  Layers,
  Sprout,
  ExternalLink,
} from "lucide-react";
import {
  useAdminProfileDetails,
  useActivateProfile,
  useDeactivateProfile,
  useVerifyProfile,
} from "./profiles.queries";
import { useFarmPlotsByOwner, usePlotZones } from "../farm/farm.queries";
import { usePlantsByFarmPlot } from "../plant-disease/plants.queries";
import { ROUTES } from "../../../lib/routes";
import type { ProfileRole, FarmPlotDto } from "../types";

// ---- Helpers ---------------------------------------------------------------

function getInitials(name: string | null, fallback: string): string {
  const source = name ?? fallback;
  const parts = source.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function hashColor(str: string): string {
  const colors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function RoleBadge({ role }: { role: ProfileRole | null }) {
  if (role === "EXPERT") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
        Chuyên gia
      </span>
    );
  }
  if (role === "FARMER") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        Nông dân
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-400 ring-1 ring-slate-200">
      Chưa đặt
    </span>
  );
}

// ---- Info row helper -------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-700 font-medium mt-0.5 wrap-break-word">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ---- Farm status badge helper ----------------------------------------------

function PlotStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700 ring-1 ring-green-200",
    INACTIVE: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    ARCHIVED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Không hoạt động",
    ARCHIVED: "Lưu trữ",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-400"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function PlantStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    INACTIVE: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    ARCHIVED: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Đang trồng",
    INACTIVE: "Không hoạt động",
    ARCHIVED: "Lưu trữ",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-400"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// ---- Expanded plot sub-section (zones + plants) ----------------------------

function PlotExpansionRow({ plot }: { plot: FarmPlotDto }) {
  const { data: zones, isLoading: zonesLoading } = usePlotZones(plot.id);
  const { data: plantsPage, isLoading: plantsLoading } = usePlantsByFarmPlot(
    plot.id,
  );
  const plants = plantsPage?.content ?? [];

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-4 py-4 space-y-4">
      {/* Zones */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          Khu vực ({zones?.length ?? 0})
        </h4>
        {zonesLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang tải khu vực...
          </div>
        ) : !zones || zones.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa có khu vực nào</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">
                    Tên khu vực
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Mã</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Loại cây
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Loại đất
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Diện tích (m²)
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {zones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {zone.zoneName}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">
                      {zone.zoneCode ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {zone.cropType ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {zone.soilType ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {zone.areaM2 != null
                        ? zone.areaM2.toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <PlotStatusBadge status={zone.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plants */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5" />
          Cây trồng ({plantsPage?.totalElements ?? 0})
        </h4>
        {plantsLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Đang tải cây trồng...
          </div>
        ) : plants.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Chưa có cây trồng nào</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Số cây</th>
                  <th className="px-3 py-2 text-left font-semibold">Tên gọi</th>
                  <th className="px-3 py-2 text-left font-semibold">Mã thẻ</th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Ngày trồng
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {plants.map((plant) => (
                  <tr
                    key={plant.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-slate-500">
                      {plant.plantNumber}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700">
                      {plant.nickName ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-400">
                      {plant.tagCode ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {plant.plantingDate
                        ? new Date(plant.plantingDate).toLocaleDateString(
                            "vi-VN",
                          )
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <PlantStatusBadge status={plant.plantStatus} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={ROUTES.ADMIN.PLANT_DETAIL(plant.id)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(plantsPage?.totalElements ?? 0) > plants.length && (
              <p className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                Hiển thị {plants.length} / {plantsPage!.totalElements} cây trồng
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Farm section ----------------------------------------------------------

function FarmSection({ profileId }: { profileId: string }) {
  const { data: plots, isLoading, isError } = useFarmPlotsByOwner(profileId);
  const [expandedPlotId, setExpandedPlotId] = useState<string | null>(null);

  const togglePlot = (id: string) =>
    setExpandedPlotId((prev) => (prev === id ? null : id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Tractor className="w-4 h-4 text-amber-500" />
        Ruộng / Vườn ({plots?.length ?? 0})
      </h2>

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải dữ liệu ruộng...
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4">
          <AlertCircle className="w-4 h-4" />
          Không thể tải dữ liệu ruộng
        </div>
      ) : !plots || plots.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          Chưa có ruộng / vườn nào
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left w-6" />
                <th className="px-4 py-2.5 text-left font-semibold">
                  Tên ruộng
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">Mã</th>
                <th className="px-4 py-2.5 text-right font-semibold">
                  Diện tích (m²)
                </th>
                <th className="px-4 py-2.5 text-left font-semibold">
                  Trạng thái
                </th>
                <th className="px-4 py-2.5 text-right font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {plots.map((plot) => (
                <>
                  <tr
                    key={plot.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => togglePlot(plot.id)}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expandedPlotId === plot.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {plot.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-xs">
                      {plot.code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {plot.areaM2 != null
                        ? plot.areaM2.toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PlotStatusBadge status={plot.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={ROUTES.ADMIN.FARM_DETAIL(plot.id)}
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                  {expandedPlotId === plot.id && (
                    <tr key={`${plot.id}-expansion`}>
                      <td colSpan={6} className="p-0">
                        <PlotExpansionRow plot={plot} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Main page -------------------------------------------------------------

export function ProfileDetailPage() {
  const { profileId = "" } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading,
    isError,
  } = useAdminProfileDetails(profileId);
  const activateMutation = useActivateProfile();
  const deactivateMutation = useDeactivateProfile();
  const verifyMutation = useVerifyProfile();

  const isActionPending =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    verifyMutation.isPending;

  // ---- Loading state -------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ---- Error state ---------------------------------------------------------
  if (isError || !profile) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROFILES)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <AlertCircle className="w-10 h-10" />
          <p className="text-base font-medium">Không tìm thấy hồ sơ</p>
          <p className="text-sm">
            Hồ sơ có thể đã bị xóa hoặc ID không tồn tại.
          </p>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.avatar ?? profile.profilePicture;
  const initials = getInitials(profile.fullName, profile.email ?? profile.id);
  const colorClass = hashColor(profile.id);

  const addressParts = [
    profile.addressLine,
    profile.provinceCode,
    profile.districtCode,
    profile.wardCode,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : null;

  return (
    <div className="p-4 space-y-5">
      {/* Back nav */}
      <button
        onClick={() => navigate(ROUTES.ADMIN.PROFILES)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách hồ sơ
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={profile.fullName ?? "avatar"}
              className="w-20 h-20 rounded-full object-cover shrink-0 ring-4 ring-slate-100"
            />
          ) : (
            <div
              className={`w-20 h-20 rounded-full ${colorClass} shrink-0 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-slate-100`}
            >
              {initials || "?"}
            </div>
          )}

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800">
                {profile.fullName ?? (
                  <span className="text-slate-400 italic">Chưa đặt tên</span>
                )}
              </h1>
              {profile.isVerified && (
                <BadgeCheck
                  className="w-5 h-5 text-sky-500 shrink-0"
                  strokeWidth={2}
                />
              )}
            </div>
            <p className="text-sm text-slate-400 mb-3">
              {profile.email ?? "—"}
            </p>
            <div className="flex flex-wrap gap-2">
              <RoleBadge role={profile.role} />
              {profile.isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Đã xác minh
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                  Chưa xác minh
                </span>
              )}
              {profile.active ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 ring-1 ring-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Hoạt động
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Bị khóa
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
            {profile.active ? (
              <button
                onClick={() => deactivateMutation.mutate(profile.id)}
                disabled={isActionPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 ring-1 ring-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deactivateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" strokeWidth={2.5} />
                )}
                Khóa hồ sơ
              </button>
            ) : (
              <button
                onClick={() => activateMutation.mutate(profile.id)}
                disabled={isActionPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 ring-1 ring-emerald-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" strokeWidth={2.5} />
                )}
                Kích hoạt hồ sơ
              </button>
            )}
            {!profile.isVerified && (
              <button
                onClick={() => verifyMutation.mutate(profile.id)}
                disabled={isActionPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 ring-1 ring-sky-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
                )}
                Xác minh hồ sơ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bio & Specialty */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Thông tin cá nhân
          </h2>
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="Tiểu sử"
            value={profile.bio}
          />
          <InfoRow
            icon={<Award className="w-4 h-4" />}
            label="Chuyên môn"
            value={profile.specialty}
          />
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Liên hệ
          </h2>
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={profile.email}
          />
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label="Số điện thoại"
            value={profile.phoneNumber}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Địa chỉ"
            value={fullAddress}
          />
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Tài khoản
          </h2>
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Ngày tạo"
            value={formatDate(profile.createdAt)}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label="Cập nhật lần cuối"
            value={formatDate(profile.lastModifiedAt)}
          />
          <InfoRow
            icon={<User className="w-4 h-4" />}
            label="ID hồ sơ"
            value={
              <span className="font-mono text-xs text-slate-500">
                {profile.id}
              </span>
            }
          />
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
            Chứng chỉ ({profile.certificates?.length ?? 0})
          </h2>
          {!profile.certificates || profile.certificates.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              Chưa có chứng chỉ nào
            </p>
          ) : (
            <div className="space-y-3">
              {profile.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {cert.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cert.issuedBy}
                      {cert.issueDate ? ` · ${cert.issueDate}` : ""}
                    </p>
                    {cert.expired && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-500 ring-1 ring-red-100">
                        Đã hết hạn
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Farm plots, zones, and plants */}
      <FarmSection profileId={profile.id} />
    </div>
  );
}
