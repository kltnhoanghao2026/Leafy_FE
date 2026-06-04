import { useNavigate } from 'react-router-dom';
import { CalendarDays, ListChecks, Leaf, MapPin } from 'lucide-react';
import type { PlantEventResponse } from '../../shared/types';
import {
  EVENT_TYPE_LABELS,
  formatDate,
  getEventCategory,
  CATEGORY_DOT_COLORS,
} from '../../shared/components/displayUtils';
import { ROUTES } from '../../../../lib/routes';
import { EventCardTasks } from './EventCardTasks';
import { useTranslation } from '../../../../i18n';
import { getPlantEventDisplayText } from '../utils/alertEventDetails';

interface EventCardProps {
  event: PlantEventResponse;
  onToggleTask?: (event: PlantEventResponse, taskIndex: number) => void;
}

export function EventCard({ event, onToggleTask }: EventCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const category = getEventCategory(event.eventType);
  const stripColor = CATEGORY_DOT_COLORS[category];
  const tasks = event.tasks ?? [];
  const tasksDone = tasks.filter(t => t.completed).length;
  const { subtitle } = getPlantEventDisplayText(t, event);

  return (
    <article className="flex overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      {/* Left color strip */}
      <div className="w-1 shrink-0" style={{ backgroundColor: stripColor }} />
      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        {/* Title + status badge */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm font-bold leading-snug ${
            event.completed ? 'text-slate-400 line-through' : 'text-slate-900'
          }`}>
            {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {tasks.length > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: tasksDone === tasks.length ? '#10B98118' : stripColor + '18',
                  color: tasksDone === tasks.length ? '#10B981' : stripColor,
                  borderColor: tasksDone === tasks.length ? '#10B98144' : stripColor + '44',
                }}
              >
                <ListChecks className="h-2.5 w-2.5" />
                {tasksDone}/{tasks.length}
              </span>
            )}
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: stripColor + '18',
                color: stripColor,
                borderColor: stripColor + '44',
              }}
            >
              {event.planned ? 'Đã lên lịch' : 'Đã ghi nhận'}
            </span>
          </div>
        </div>

        {/* Description */}
        {subtitle && (
          <p className="line-clamp-1 text-xs text-slate-500">
            {subtitle}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
          <span>{formatDate(event.calculatedStartDate)}</span>
          {event.calculatedEndDate && event.calculatedEndDate !== event.calculatedStartDate && (
            <>
              <span>→</span>
              <span>{formatDate(event.calculatedEndDate)}</span>
            </>
          )}
          {/* Plant badge */}
          {event.plant && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD.PLANT_DETAIL(event.plantId))}
              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <Leaf className="h-2.5 w-2.5" />
              {event.plant.nickName || event.plant.plantNumber || event.plant.tagCode || event.plant.id.slice(0, 8)}
            </button>
          )}
          {/* Farm Zone badge */}
          {event.farmZone?.zoneName && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD.FARM_ZONE_DETAIL(event.farmPlotId ?? '', event.farmZoneId ?? ''))}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <MapPin className="h-2.5 w-2.5" />
              {event.farmZone.zoneName}
            </button>
          )}
          {/* Farm Plot badge (only if no zone) */}
          {event.farmPlot?.name && !event.farmZone?.zoneName && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD.FARM_PLOT_DETAIL(event.farmPlotId ?? ''))}
              className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <MapPin className="h-2.5 w-2.5" />
              {event.farmPlot.name}
            </button>
          )}
          {/* Plan badge */}
          {event.planApply && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD.PLAN_DETAIL(event.planApply.planId ?? ''))}
              className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <CalendarDays className="h-2.5 w-2.5" />
              {event.planApply.planName || event.planApply.diseaseName || 'Kế hoạch'}
            </button>
          )}
          {event.estimatedCost && (
            <span className="ml-auto font-semibold text-slate-600">
              {event.estimatedCost}
            </span>
          )}
        </div>

        {/* Task checklist */}
        <EventCardTasks event={event} stripColor={stripColor} onToggleTask={onToggleTask} />
      </div>
    </article>
  );
}
