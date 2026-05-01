import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  AlertCircle,
  Loader2,
  Tag,
  MapPin,
  DollarSign,
  Shield,
  Activity,
} from "lucide-react";
import { usePlantEvent } from "./plantEvents.queries";

// ---- Helpers ---------------------------------------------------------------

const EVENT_TYPE_LABELS: Record<string, string> = {
  IRRIGATION: "Tưới nước",
  NUTRITION: "Bón phân",
  WEED_CONTROL: "Diệt cỏ",
  PRUNING: "Cắt tỉa",
  SCOUTING: "Kiểm tra",
  DISEASE_DETECTED: "Phát hiện bệnh",
  TREATMENT_APPLICATION: "Phun thuốc",
  QUARANTINE: "Cách ly",
  HEALTH_RECOVERY: "Hồi phục",
  PHENOLOGY: "Sinh trưởng",
  REPOT: "Sang chậu",
  HARVEST: "Thu hoạch",
};

const EVENT_TYPE_STYLES: Record<string, string> = {
  DISEASE_DETECTED: "bg-red-50 text-red-700 ring-red-200",
  QUARANTINE: "bg-red-50 text-red-700 ring-red-200",
  TREATMENT_APPLICATION: "bg-orange-50 text-orange-700 ring-orange-200",
  HARVEST: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function getEventTypeBadgeStyle(type: string): string {
  return EVENT_TYPE_STYLES[type] ?? "bg-sky-50 text-sky-700 ring-sky-200";
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

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
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <div className="text-sm text-slate-800 font-medium wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  );
}

// ---- Page ------------------------------------------------------------------

export function PlantEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = usePlantEvent(id ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm font-medium">Không tìm thấy sự kiện</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-emerald-600 hover:underline font-semibold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const typeBadgeStyle = getEventTypeBadgeStyle(event.eventType);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? event.eventType;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50">
            <CalendarDays className="w-5 h-5 text-violet-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">
              Chi tiết sự kiện
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {event.id}
            </p>
          </div>
        </div>
        <span
          className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${typeBadgeStyle}`}
        >
          {typeLabel}
        </span>
      </div>

      {/* 2-column detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Core info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Thông tin sự kiện
          </h2>
          <InfoRow
            icon={<Activity className="w-3.5 h-3.5 text-slate-400" />}
            label="Loại sự kiện"
            value={typeLabel}
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Mã cây (ID)"
            value={
              event.plantId ? (
                <span className="font-mono">{event.plantId}</span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
            label="Farm Plot (ID)"
            value={event.farmPlotId ?? "—"}
          />
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
            label="Farm Zone (ID)"
            value={event.farmZoneId ?? "—"}
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Loại lịch"
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${
                  event.planned
                    ? "bg-blue-50 text-blue-700 ring-blue-200"
                    : "bg-slate-100 text-slate-500 ring-slate-200"
                }`}
              >
                {event.planned ? "Kế hoạch" : "Tức thời"}
              </span>
            }
          />
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Lịch trình
          </h2>
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày bắt đầu tính toán"
            value={formatDate(event.calculatedStartDate)}
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày kết thúc tính toán"
            value={formatDate(event.calculatedEndDate)}
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Ngày từ hiện tại"
            value={
              event.daysFromNow != null ? `${event.daysFromNow} ngày` : "—"
            }
          />
          <InfoRow
            icon={<CalendarDays className="w-3.5 h-3.5 text-slate-400" />}
            label="Thời gian (ngày)"
            value={
              event.durationDays != null ? `${event.durationDays} ngày` : "—"
            }
          />
        </div>

        {/* Treatment / agronomic details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Xử lý nông học
          </h2>
          <InfoRow
            icon={<Shield className="w-3.5 h-3.5 text-slate-400" />}
            label="PHI (ngày)"
            value={event.phiDays != null ? `${event.phiDays} ngày` : "—"}
          />
          <InfoRow
            icon={<Shield className="w-3.5 h-3.5 text-slate-400" />}
            label="Yêu cầu PPE"
            value={event.ppeRequired ?? "—"}
          />
          <InfoRow
            icon={<Shield className="w-3.5 h-3.5 text-slate-400" />}
            label="Ghi chú MRL"
            value={event.mrlNote ?? "—"}
          />
          <InfoRow
            icon={<DollarSign className="w-3.5 h-3.5 text-slate-400" />}
            label="Chi phí ước tính"
            value={
              event.estimatedCost != null
                ? Number(event.estimatedCost).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })
                : "—"
            }
          />
          <InfoRow
            icon={<Tag className="w-3.5 h-3.5 text-slate-400" />}
            label="Source Plan (ID)"
            value={
              event.sourcePlanId ? (
                <span className="font-mono">{event.sourcePlanId}</span>
              ) : (
                "—"
              )
            }
          />
        </div>

        {/* Notes & description */}
        {(event.note || event.description) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Ghi chú & Mô tả
            </h2>
            {event.note && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Ghi chú
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {event.note}
                </p>
              </div>
            )}
            {event.description && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Mô tả
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
