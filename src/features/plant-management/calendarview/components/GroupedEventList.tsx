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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PlantEventResponse, PlantEventType } from '../../shared/types';
import {
  type EventCategory,
  EVENT_CATEGORY_MAP,
  CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  formatDate,
} from '../../shared/components/displayUtils';

// ── Icon map (mirrors APP's EVENT_TYPE_ICONS) ──────────────────────────────────
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

// ── Category accent styles (mirrors APP's CATEGORY_ACCENT) ─────────────────────
const CATEGORY_ACCENT: Record<
  EventCategory,
  {
    border: string;
    headerBg: string;
    countBg: string;
    countText: string;
    iconBg: string;
    iconText: string;
    stripBg: string;
  }
> = {
  ROUTINE_CARE: {
    border: 'border-blue-200',
    headerBg: 'bg-blue-50',
    countBg: 'bg-blue-100',
    countText: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    stripBg: 'bg-blue-400',
  },
  HEALTH_MEDICAL: {
    border: 'border-orange-200',
    headerBg: 'bg-orange-50',
    countBg: 'bg-orange-100',
    countText: 'text-orange-600',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    stripBg: 'bg-orange-400',
  },
  GROWTH_LIFECYCLE: {
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    stripBg: 'bg-emerald-400',
  },
};

// ── Order to display categories ───────────────────────────────────────────────
const CATEGORY_ORDER: EventCategory[] = [
  'ROUTINE_CARE',
  'HEALTH_MEDICAL',
  'GROWTH_LIFECYCLE',
];

// ── EventCard (web version of APP's EventCard.tsx) ────────────────────────────

interface EventCardProps {
  event: PlantEventResponse;
  accent: (typeof CATEGORY_ACCENT)[EventCategory];
  onEdit?: (event: PlantEventResponse) => void;
}

function EventCard({ event, accent, onEdit }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? Droplets;

  const hasDetails =
    !!event.description ||
    event.calculatedEndDate != null ||
    event.durationDays != null ||
    event.phiDays != null ||
    event.ppeRequired != null ||
    event.mrlNote != null ||
    event.estimatedCost != null;

  return (
    <article className="mb-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Main row */}
      <div className="flex items-center">
        {/* Category color strip */}
        <div className={`w-1.5 self-stretch min-h-[64px] ${accent.stripBg} opacity-70`} />

        <div className="flex flex-1 items-center gap-3 px-3 py-3">
          {/* Icon */}
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.iconBg}`}>
            <Icon className={`h-4 w-4 ${accent.iconText}`} />
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">
              {event.note || event.description || 'Không có ghi chú'}
            </p>
            <p className={`mt-0.5 text-[11px] font-semibold ${accent.iconText}`}>
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              {event.durationDays != null ? ` · ${event.durationDays} ngày` : ''}
            </p>
          </div>

          {/* Right side: date + planned badge + expand toggle */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[10px] font-medium text-slate-400">
              {event.calculatedStartDate?.slice(5) ?? '—'}
            </span>
            {event.planned && (
              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">
                Đã lên lịch
              </span>
            )}
            {hasDetails && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-0.5 text-slate-400 hover:text-slate-600"
                aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="mx-3 mb-3 mt-0 border-t border-slate-100 pt-2">
          {event.description && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Mô tả
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{event.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {event.calculatedEndDate && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Kết thúc
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {event.calculatedEndDate.slice(5)}
                </p>
              </div>
            )}
            {event.durationDays != null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Thời lượng
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {event.durationDays} ngày
                </p>
              </div>
            )}
            {event.phiDays != null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  PHI
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {event.phiDays} ngày
                </p>
              </div>
            )}
            {event.estimatedCost != null && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Chi phí
                </p>
                <p className="text-xs font-medium text-slate-600">
                  {event.estimatedCost}
                </p>
              </div>
            )}
          </div>

          {event.ppeRequired && (
            <div className="mt-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                PPE
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{event.ppeRequired}</p>
            </div>
          )}
          {event.mrlNote && (
            <div className="mt-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Ghi chú MRL
              </p>
              <p className="mt-0.5 text-xs text-slate-600">{event.mrlNote}</p>
            </div>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className={`mt-2 text-xs font-semibold ${accent.iconText}`}
            >
              Chỉnh sửa →
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ── CategorySection (web version of APP's PlantEventHubCategorySection.tsx) ───

interface CategorySectionProps {
  category: EventCategory;
  events: PlantEventResponse[];
  onEdit?: (event: PlantEventResponse) => void;
}

function CategorySection({ category, events, onEdit }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const accent = CATEGORY_ACCENT[category];

  return (
    <div className={`mb-2 overflow-hidden rounded-2xl border ${accent.border}`}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className={`flex w-full items-center justify-between px-3 py-2.5 ${accent.headerBg}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
            {CATEGORY_LABELS[category]}
          </span>
          <span className={`rounded-full px-1.5 py-0.5 ${accent.countBg}`}>
            <span className={`text-[10px] font-bold ${accent.countText}`}>
              {events.length}
            </span>
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {/* Event list */}
      {!collapsed && (
        <div className="px-2 pb-2 pt-1">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              accent={accent}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── GroupedEventList (public API) ──────────────────────────────────────────────

export interface GroupedEventListProps {
  /** The events to display — they will be split by EventCategory automatically. */
  events: PlantEventResponse[];
  /** Called when user clicks "Chỉnh sửa →" inside an expanded card. */
  onEdit?: (event: PlantEventResponse) => void;
  /** Shown when all three category buckets are empty. */
  emptyNode?: React.ReactNode;
}

/**
 * Mirrors Leafy_APP's `renderGroupedEvents()` helper:
 * - Buckets events into ROUTINE_CARE / HEALTH_MEDICAL / GROWTH_LIFECYCLE
 * - Renders each non-empty bucket as a collapsible CategorySection
 * - Each event card has a color strip, icon, expandable details
 */
export function GroupedEventList({
  events,
  onEdit,
  emptyNode,
}: GroupedEventListProps) {
  const grouped: Record<EventCategory, PlantEventResponse[]> = {
    ROUTINE_CARE: [],
    HEALTH_MEDICAL: [],
    GROWTH_LIFECYCLE: [],
  };

  for (const evt of events) {
    const cat = EVENT_CATEGORY_MAP[evt.eventType] ?? 'ROUTINE_CARE';
    grouped[cat].push(evt);
  }

  const hasAny = CATEGORY_ORDER.some((cat) => grouped[cat].length > 0);
  if (!hasAny) return emptyNode ? <>{emptyNode}</> : null;

  return (
    <>
      {CATEGORY_ORDER.map((cat) => {
        const catEvents = grouped[cat];
        if (catEvents.length === 0) return null;
        return (
          <CategorySection
            key={cat}
            category={cat}
            events={catEvents}
            onEdit={onEdit}
          />
        );
      })}
    </>
  );
}
