import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PlantEventResponse } from '../../shared/types';
import {
  type EventCategory,
  EVENT_CATEGORY_MAP,
  CATEGORY_LABELS,
} from '../../shared/components/displayUtils';
import { EventRow } from './EventRow';
import type { EventAccentStyle } from './EventRow';

// ── Category accent styles ────────────────────────────────────────────────────
const CATEGORY_ACCENT: Record<EventCategory, EventAccentStyle> = {
  ROUTINE_CARE: {
    borderColor: '#3B82F6',
    headerText: 'text-blue-700',
    countBg: 'bg-blue-100',
    countText: 'text-blue-700',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-500',
    dotColor: '#3B82F6',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-700',
    headerBadgeBg: 'bg-blue-50',
    headerBadgeText: 'text-blue-600',
  },
  HEALTH_MEDICAL: {
    borderColor: '#F97316',
    headerText: 'text-orange-700',
    countBg: 'bg-orange-100',
    countText: 'text-orange-700',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-500',
    dotColor: '#F97316',
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    badgeText: 'text-orange-700',
    headerBadgeBg: 'bg-red-50',
    headerBadgeText: 'text-red-500',
  },
  GROWTH_LIFECYCLE: {
    borderColor: '#10B981',
    headerText: 'text-emerald-700',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    dotColor: '#10B981',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-[#245A34]',
    headerBadgeBg: 'bg-emerald-50',
    headerBadgeText: 'text-emerald-700',
  },
};

const CATEGORY_ORDER: EventCategory[] = ['ROUTINE_CARE', 'HEALTH_MEDICAL', 'GROWTH_LIFECYCLE'];


// ── CategorySection ───────────────────────────────────────────────────────────
interface CategorySectionProps {
  category: EventCategory;
  events: PlantEventResponse[];
  onEdit?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
}

function CategorySection({ category, events, onEdit, onEventHover }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const accent = CATEGORY_ACCENT[category];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: accent.borderColor }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60"
      >
        <span className={`flex-1 text-sm font-semibold ${accent.headerText}`}>
          {CATEGORY_LABELS[category]}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${accent.countBg} ${accent.countText}`}>
          {events.length}
        </span>
        {collapsed
          ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          : <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>

      {/* Event rows */}
      {!collapsed && (
        <div className="border-t border-slate-100">
          {events.map((event, i) => (
            <EventRow
              key={event.id}
              event={event}
              accent={accent}
              isLast={i === events.length - 1}
              onEdit={onEdit}
              onEventHover={onEventHover}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── GroupedEventList (public API) ─────────────────────────────────────────────

export interface GroupedEventListProps {
  events: PlantEventResponse[];
  selectedDate?: string | null;
  onEdit?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
  emptyNode?: React.ReactNode;
}

export function GroupedEventList({ events, onEdit, onEventHover, emptyNode }: GroupedEventListProps) {
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

  const filledCategories = CATEGORY_ORDER.filter(cat => grouped[cat].length > 0);

  const totalCount = filledCategories.reduce((sum, cat) => sum + grouped[cat].length, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* List header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
        <span className="text-sm font-semibold text-slate-700">Danh sách sự kiện</span>
        <span className="text-xs text-slate-400">{totalCount} sự kiện</span>
      </div>

      {filledCategories.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          events={grouped[cat]}
          onEdit={onEdit}
          onEventHover={onEventHover}
        />
      ))}
    </div>
  );
}

