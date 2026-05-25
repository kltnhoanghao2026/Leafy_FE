import { useState } from 'react';
import {
  Droplets,
  Beaker,
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
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { PlantEventResponse, PlantEventType } from '../../shared/types';
import { EVENT_TYPE_LABELS } from '../../shared/components/displayUtils';
import { addLocalDays } from '../../shared/utils/dateOnly';
import { fmtShortDate } from '../utils/dateUtils';
import { EventExpandedDetails } from './EventExpandedDetails';
import { EventProgressBar } from './EventProgressBar';
import { ScopeProgressBar } from './ScopeProgressBar';
import { EventBadgeRow } from './EventBadgeRow';
import type { EventAccentStyle } from '../schemas/eventAccent';
import { useTranslation } from '../../../../i18n';
import { usePlantEvent } from '../..';

// ── Icon map ──────────────────────────────────────────────────────────────────
const EVENT_TYPE_ICONS: Record<PlantEventType, React.ComponentType<{ className?: string; size?: number }>> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Scissors,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
  ALERT_TRIGGERED: ShieldAlert,
};

export { EVENT_TYPE_ICONS };
export type { EventAccentStyle };

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

export function EventRow({
  event,
  accent,
  isLast,
  onEdit,
  onDelete,
  onEventHover,
  onToggleComplete,
  onToggleTask,
  onSelectEvent,
}: EventRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? Droplets;

  // Always fetch live data so task/child progress reflects server state
  const { data: liveEvent } = usePlantEvent(event.id, true);
  const displayEvent = liveEvent ?? event;

  const startLabel = fmtShortDate(event.calculatedStartDate);
  const endLabel = fmtShortDate(event.calculatedEndDate);
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
    (event.tasks != null && event.tasks.length > 0) ||
    (event.attachmentIds != null && event.attachmentIds.length > 0) ||
    event.plant != null ||
    event.farmPlot != null ||
    event.farmZone != null ||
    event.planApply != null;

  // ── Inline progress: tasks ────────────────────────────────────────────────
  const taskProgress = (() => {
    if (!displayEvent.tasks || displayEvent.tasks.length === 0) return null;
    const done = displayEvent.tasks.filter(t => t.completed).length;
    return <EventProgressBar done={done} total={displayEvent.tasks.length} dotColor={accent.dotColor} />;
  })();

  // ── Inline progress: children ──────────────────────────────────────────────
  const childProgress = (() => {
    const directChildren = displayEvent.children ?? [];
    if (directChildren.length === 0) return null;

    const done = directChildren.filter(c => c.completed).length;
    const isZone = displayEvent.targetType === 'FARM';
    return (
      <ScopeProgressBar done={done} total={directChildren.length} isZone={isZone} dotColor={accent.dotColor} />
    );
  })();

  return (
    <div
      onMouseEnter={() => { setHovered(true); onEventHover?.(event); }}
      onMouseLeave={() => { setHovered(false); onEventHover?.(null); }}
      style={hovered ? { backgroundColor: `${accent.dotColor}0d` } : undefined}
      className="transition-colors duration-150"
    >
      {/* Main row */}
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

        {/* Row content */}
        <div className="flex flex-1 items-center gap-3 py-3">
          {/* Complete toggle */}
          {onToggleComplete && (
            <button
              type="button"
              title={event.completed ? t('plantManagement.calendar.taskCompleted') : t('plantManagement.calendar.taskIncomplete')}
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

            {/* Quick entity badges */}
            {(event.plant?.nickName || event.plant?.plantNumber || event.plant?.tagCode ||
              event.farmZone?.zoneName || event.farmPlot?.name) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <EventBadgeRow event={event} />
              </div>
            )}

            {/* Task progress inline */}
            {taskProgress}

            {/* Child / legacy progress inline */}
            {childProgress}
          </div>

          {/* Details button */}
          <button
            type="button"
            onClick={() => hasDetails && setExpanded(v => !v)}
            style={{ cursor: hasDetails ? 'pointer' : 'default' }}
            className="shrink-0 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {t('plantManagement.calendar.detailLabel')}
            {hasDetails
              ? expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>
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
              {t('plantManagement.calendar.eventDetailTitle')}
            </span>
            {event.planned && (
              <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-600">
                {t('plantManagement.calendar.plannedBadge')}
              </span>
            )}
          </div>

          <EventExpandedDetails
            event={displayEvent}
            accent={accent}
            Icon={Icon}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelectEvent={onSelectEvent}
            onToggleTask={onToggleTask}
            startLabel={startLabel}
            endLabel={endLabel}
          />
        </div>
      )}
    </div>
  );
}
