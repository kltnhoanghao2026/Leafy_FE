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
  CheckCircle2,
  Circle,
  ListChecks,
  MapPin,
  Leaf,
} from 'lucide-react';
import type { PlantEventResponse, PlantEventType } from '../../shared/types';
import { EVENT_TYPE_LABELS, TARGET_TYPE_LABELS, TARGET_TYPE_ICONS } from '../../shared/components/displayUtils';
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
  onDelete?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
}

export function EventRow({ event, accent, isLast, onEdit, onDelete, onEventHover, onToggleComplete, onToggleTask, onSelectEvent }: EventRowProps) {
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
    event.estimatedCost != null ||
    (event.tasks != null && event.tasks.length > 0);

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

        {/* Complete toggle */}
        {onToggleComplete && (
          <button
            type="button"
            title={event.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            onClick={() => onToggleComplete(event)}
            className="shrink-0 transition-colors hover:opacity-70"
          >
            {event.completed
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <Circle className="h-5 w-5 text-slate-300" />}
          </button>
        )}

        {/* Icon badge */}
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent.iconBg}`}>
          <Icon className={`h-4 w-4 ${accent.iconText}`} />
        </span>

        {/* Content */}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${event.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
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
          {/* Task progress inline badge */}
          {event.tasks != null && event.tasks.length > 0 && (() => {
            const tasks = event.tasks!;
            const done = tasks.filter(t => t.completed).length;
            const allDone = done === tasks.length;
            const pct = Math.round((done / tasks.length) * 100);
            return (
              <div className="mt-1.5 flex items-center gap-1.5">
                <ListChecks className="h-3 w-3 shrink-0" style={{ color: allDone ? '#10B981' : accent.dotColor }} />
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: allDone ? '#10B981' : accent.dotColor,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-black tabular-nums"
                  style={{ color: allDone ? '#10B981' : accent.dotColor }}
                >
                  {done}/{tasks.length}
                </span>
              </div>
            );
          })()}
          {/* Broad-scope progress inline (children or ZONE/PLANT tracking) */}
          {(() => {
            const directChildren = event.children ?? [];
            const hasChildren = directChildren.length > 0;
            const hasLegacyProgress = event.trackingGranularity && event.trackingGranularity !== 'NONE' &&
              event.progressTotal != null && event.progressTotal > 0;

            if (!hasChildren && !hasLegacyProgress) return null;

            const total = hasChildren ? directChildren.length : event.progressTotal!;
            const done = hasChildren
              ? directChildren.filter(c => c.completed).length
              : (event.progressCompleted ?? 0);
            const allDone = done === total;
            const pct = Math.round((done / total) * 100);

            const isZone = hasChildren
              ? event.targetType === 'FARM'
              : event.trackingGranularity === 'ZONE';
            const TrackIcon = isZone ? MapPin : Leaf;
            const trackLabel = isZone ? 'vùng' : 'cây';
            return (
              <div className="mt-1.5 flex items-center gap-1.5">
                <TrackIcon className="h-3 w-3 shrink-0" style={{ color: allDone ? '#10B981' : accent.dotColor }} />
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: allDone ? '#10B981' : accent.dotColor,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-black tabular-nums"
                  style={{ color: allDone ? '#10B981' : accent.dotColor }}
                >
                  {done}/{total} {trackLabel}
                </span>
              </div>
            );
          })()}
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
            {(startLabel || endLabel || event.durationDays != null || event.estimatedCost != null || event.phiDays != null
              || (event.trackingGranularity && event.trackingGranularity !== 'NONE' && event.progressTotal != null && event.progressTotal > 0)
            ) && (
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

            {/* Scope badge — shown whenever targetType is set */}
            {event.targetType && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm" aria-hidden>
                  {(() => {
                    const TargetIcon = TARGET_TYPE_ICONS[event.targetType];
                    return TargetIcon ? <TargetIcon className="h-3.5 w-3.5" /> : null;
                  })()}
                </span>
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide"
                  style={{
                    borderColor: `${accent.dotColor}40`,
                    color: accent.dotColor,
                    backgroundColor: `${accent.dotColor}10`,
                  }}
                >
                  {TARGET_TYPE_LABELS[event.targetType] ?? event.targetType}
                </span>
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

            {/* Task checklist */}
            {event.tasks != null && event.tasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Công việc</p>
                {event.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2"
                  >
                    <button
                      type="button"
                      title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
                      onClick={() => onToggleTask?.(event, idx)}
                      className="mt-0.5 shrink-0 transition-colors hover:opacity-70"
                    >
                      {task.completed
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        : <Circle className="h-4 w-4 text-slate-300" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-0.5 text-[11px] text-slate-400">{task.description}</p>
                      )}
                    </div>
                    {task.estimatedCost && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${accent.countBg} ${accent.countText}`}>
                        {task.estimatedCost}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Edit / Delete buttons */}
            {(onEdit || onDelete || (onSelectEvent && (event.farmPlotId || event.farmZoneId))) && (
              <div className="flex justify-end gap-2 pt-0.5">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    Xóa
                  </button>
                )}
                {onSelectEvent && (event.targetType === 'FARM' || event.targetType === 'FARM_ZONE' || event.farmPlotId || event.farmZoneId) && (
                  <button
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#245A34] hover:bg-[#245A34]/10 hover:text-[#245A34]"
                  >
                    <Leaf className="h-3 w-3" />
                    Theo dõi
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${accent.badgeBg} ${accent.badgeBorder} ${accent.badgeText} hover:opacity-80`}
                  >
                    <Pencil className="h-3 w-3" />
                    Chỉnh sửa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
