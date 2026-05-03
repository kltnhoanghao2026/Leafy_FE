import { useState } from 'react';
import {
  Droplets,
  Beaker,
  Trash2,
  Scissors,
  Search,
  Bug,
  Syringe,
  ShieldAlert,
  HeartPulse,
  Activity,
  PackageOpen,
  Wheat,
  ChevronRight,
  ChevronUp,
  Pencil,
  CalendarDays,
  Clock,
  DollarSign,
  Info,
} from 'lucide-react';
import type { PlantEventResponse, PlantEventType } from '../../shared/types';
import { EVENT_TYPE_LABELS } from '../../shared/components/displayUtils';
import { addLocalDays } from '../../shared/utils/dateOnly';

// ── Accent style type (shared with GroupedEventList/CategorySection) ──────────
export interface EventAccentStyle {
  borderColor: string;
  headerText: string;
  countBg: string;
  countText: string;
  iconBg: string;
  iconText: string;
  dotColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  headerBadgeBg: string;
  headerBadgeText: string;
}

// ── Icon map ──────────────────────────────────────────────────────────────────
const EVENT_TYPE_ICONS: Record<PlantEventType, React.ComponentType<{ className?: string; size?: number }>> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Trash2,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
};

/** Format a date string as DD/MM for compact display. */
function fmtShortDate(val?: string | null) {
  if (!val) return null;
  const parts = val.slice(0, 10).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return val.slice(5);
}

// ── EventRow ──────────────────────────────────────────────────────────────────
export interface EventRowProps {
  event: PlantEventResponse;
  accent: EventAccentStyle;
  isLast: boolean;
  onEdit?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
}

export function EventRow({ event, accent, isLast, onEdit, onEventHover }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? Droplets;

  const startLabel = fmtShortDate(event.calculatedStartDate);
  const endLabel   = fmtShortDate(event.calculatedEndDate);
  const durationEndLabel =
    event.durationDays != null && event.durationDays > 1 && event.calculatedStartDate
      ? fmtShortDate(addLocalDays(event.calculatedStartDate, event.durationDays - 1))
      : null;

  const hasDetails =
    !!event.description ||
    event.calculatedEndDate != null ||
    event.durationDays != null ||
    event.phiDays != null ||
    event.ppeRequired != null ||
    event.mrlNote != null ||
    event.estimatedCost != null;

  return (
    <div
      onMouseEnter={() => { setHovered(true); onEventHover?.(event); }}
      onMouseLeave={() => { setHovered(false); onEventHover?.(null); }}
      style={hovered ? { backgroundColor: `${accent.dotColor}0d` } : undefined}
      className="transition-colors duration-150"
    >
      {/* Main row — no py here so dot column spans full height */}
      <div className="flex gap-3 px-4">
        {/* Timeline dot + connector line */}
        <div className="flex w-3 shrink-0 flex-col items-center">
          <div className="w-px flex-1 bg-slate-200" />
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-150"
            style={{
              backgroundColor: accent.dotColor,
              transform: hovered ? 'scale(1.4)' : 'scale(1)',
            }}
          />
          <div className={`w-px flex-1 ${isLast ? 'bg-transparent' : 'bg-slate-200'}`} />
        </div>

        {/* Row content — py lives here so dot lines extend edge-to-edge */}
        <div className="flex flex-1 items-center gap-3 py-3">

        {/* Icon badge */}
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.iconBg}`}>
          <Icon className={`h-4 w-4 ${accent.iconText}`} />
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
          </p>
          {(event.note || event.description) && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {event.note || event.description}
            </p>
          )}
          {durationEndLabel && startLabel && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              {startLabel} → <span className={accent.iconText}>{durationEndLabel}</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${accent.countBg} ${accent.countText}`}>
                {event.durationDays}d
              </span>
            </p>
          )}
        </div>

        {/* Chi tiết button */}
        <button
          type="button"
          onClick={() => hasDetails && setExpanded(v => !v)}
          style={{ cursor: hasDetails ? 'pointer' : 'default' }}
          className="shrink-0 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Chi tiết
          {hasDetails
            ? expanded
              ? <ChevronUp className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />}
        </button>
        </div>{/* end content wrapper */}
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-slate-100">
          {/* Tinted header strip */}
          <div
            className="flex items-center gap-2 border-b border-slate-100 px-3 py-2"
            style={{ backgroundColor: `${accent.dotColor}14` }}
          >
            <span className="h-3.5 w-3.5 shrink-0 flex items-center justify-center" style={{ color: accent.dotColor }}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-semibold" style={{ color: accent.dotColor }}>
              Chi tiết sự kiện
            </span>
            {event.planned && (
              <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-600">
                Đã lên kế hoạch
              </span>
            )}
          </div>

          <div className="space-y-2.5 bg-slate-50/60 px-3 py-3">
            {/* Description */}
            {event.description && (
              <p className="text-xs leading-relaxed text-slate-600">{event.description}</p>
            )}

            {/* Metric cards */}
            {(startLabel || endLabel || event.durationDays != null || event.estimatedCost != null || event.phiDays != null) && (
              <div className="grid grid-cols-2 gap-1.5">
                {startLabel && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400">Bắt đầu</p>
                      <p className="text-xs font-semibold text-slate-700">{startLabel}</p>
                    </div>
                  </div>
                )}
                {endLabel && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400">Kết thúc</p>
                      <p className="text-xs font-semibold text-slate-700">{endLabel}</p>
                    </div>
                  </div>
                )}
                {event.durationDays != null && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400">Thời lượng</p>
                      <p className="text-xs font-semibold text-slate-700">{event.durationDays} ngày</p>
                    </div>
                  </div>
                )}
                {event.estimatedCost != null && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <DollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400">Chi phí</p>
                      <p className="text-xs font-semibold text-slate-700">{event.estimatedCost}</p>
                    </div>
                  </div>
                )}
                {event.phiDays != null && (
                  <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400">PHI (ngày cách ly)</p>
                      <p className="text-xs font-semibold text-slate-700">{event.phiDays} ngày</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PPE alert */}
            {event.ppeRequired && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-[10px] font-semibold text-amber-600">Thiết bị bảo hộ (PPE)</p>
                  <p className="text-xs text-amber-700">{event.ppeRequired}</p>
                </div>
              </div>
            )}

            {/* MRL note alert */}
            {event.mrlNote && (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-[10px] font-semibold text-red-600">Ghi chú MRL</p>
                  <p className="text-xs text-red-700">{event.mrlNote}</p>
                </div>
              </div>
            )}

            {/* Edit button */}
            {onEdit && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${accent.badgeBg} ${accent.badgeBorder} ${accent.badgeText} hover:opacity-80`}
                >
                  <Pencil className="h-3 w-3" />
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
