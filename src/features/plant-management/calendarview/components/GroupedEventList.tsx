import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import type { PlantEventResponse } from '../../shared/types';
import {
  type EventCategory,
  EVENT_CATEGORY_MAP,
  CATEGORY_LABELS,
} from '../../shared/components/displayUtils';
import { EventRow } from './EventRow';
import { CATEGORY_ACCENT_STYLES } from '../schemas/eventAccent';
import type { GroupedEventListProps } from '../schemas/calendar.types';

const CATEGORY_ORDER: EventCategory[] = ['ROUTINE_CARE', 'HEALTH_MEDICAL', 'GROWTH_LIFECYCLE', 'ALERTS'];

/** Recursively count all events (including nested children). */
function countAllEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    count += 1;
    if (e.children && e.children.length > 0) {
      count += countAllEvents(e.children);
    }
  }
  return count;
}

/** Check if a single event is considered done. */
function isEventDone(e: PlantEventResponse): boolean {
  if (e.trackingGranularity && e.trackingGranularity !== 'NONE') {
    return e.progressTotal != null && e.progressTotal > 0 && e.progressCompleted === e.progressTotal;
  }
  return e.completed;
}

/** Recursively count done events (including nested children). */
function countDoneEvents(events: PlantEventResponse[]): number {
  let count = 0;
  for (const e of events) {
    if (isEventDone(e)) count += 1;
    if (e.children && e.children.length > 0) {
      count += countDoneEvents(e.children);
    }
  }
  return count;
}


// ── CategorySection ───────────────────────────────────────────────────────────
interface CategorySectionProps {
  category: EventCategory;
  events: PlantEventResponse[];
  onEdit?: (event: PlantEventResponse) => void;
  onDelete?: (event: PlantEventResponse) => void;
  onEventHover?: (event: PlantEventResponse | null) => void;
  onToggleComplete?: (event: PlantEventResponse) => void;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
  onSelectEvent?: (event: PlantEventResponse) => void;
}

function CategorySection({ category, events, onEdit, onDelete, onEventHover, onToggleComplete, onToggleTask, onSelectEvent }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const accent = CATEGORY_ACCENT_STYLES[category];

  // Compute done count recursively (including nested children).
  const totalCount = countAllEvents(events);
  const doneCount = countDoneEvents(events);
  const allDone = doneCount === totalCount && totalCount > 0;

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
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-bold transition-colors ${
            allDone ? 'bg-emerald-100 text-emerald-700' : `${accent.countBg} ${accent.countText}`
          }`}
        >
          {doneCount}/{totalCount}
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
              onDelete={onDelete}
              onEventHover={onEventHover}
              onToggleComplete={onToggleComplete}
              onToggleTask={onToggleTask}
              onSelectEvent={onSelectEvent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── GroupedEventList (public API) ─────────────────────────────────────────────

export function GroupedEventList({ events, onEdit, onDelete, onEventHover, onToggleComplete, onToggleTask, onSelectEvent, emptyNode, headerAction, hideHeader }: GroupedEventListProps) {
  const grouped: Record<EventCategory, PlantEventResponse[]> = {
    ROUTINE_CARE: [],
    HEALTH_MEDICAL: [],
    GROWTH_LIFECYCLE: [],
    ALERTS: [],
  };

  for (const evt of events) {
    const cat = EVENT_CATEGORY_MAP[evt.eventType] ?? 'ROUTINE_CARE';
    grouped[cat].push(evt);
  }

  const hasAny = CATEGORY_ORDER.some((cat) => grouped[cat].length > 0);
  if (!hasAny) return (
    <div className="flex flex-col gap-3">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
          <span className="text-sm font-semibold text-slate-700">Danh sách sự kiện</span>
          <div className="flex items-center gap-2">
            {headerAction}
            <span className="text-xs text-slate-400">0 sự kiện</span>
          </div>
        </div>
      )}
      {emptyNode ? <>{emptyNode}</> : null}
    </div>
  );

  const filledCategories = CATEGORY_ORDER.filter(cat => grouped[cat].length > 0);

  const totalCount = filledCategories.reduce((sum, cat) => sum + countAllEvents(grouped[cat]), 0);

  return (
    <div className="flex flex-col gap-3">
      {/* List header */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
          <span className="text-sm font-semibold text-slate-700">Danh sách sự kiện</span>
          <div className="flex items-center gap-2">
            {headerAction}
            <span className="text-xs text-slate-400">{totalCount} sự kiện</span>
          </div>
        </div>
      )}

      {filledCategories.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          events={grouped[cat]}
          onEdit={onEdit}
          onDelete={onDelete}
          onEventHover={onEventHover}
          onToggleComplete={onToggleComplete}
          onToggleTask={onToggleTask}
          onSelectEvent={onSelectEvent}
        />
      ))}
    </div>
  );
}

