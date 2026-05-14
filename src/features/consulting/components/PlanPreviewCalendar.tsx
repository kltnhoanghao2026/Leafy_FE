import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { CalendarWorkspace } from '../../plant-management/calendarview/components/CalendarWorkspace';
import {
  addLocalDays,
  toLocalDateOnly,
} from '../../plant-management/shared/utils/dateOnly';
import type {
  PlantEventCreateRequest,
  PlantEventResponse,
} from '../../plant-management/shared/types';

// ── Conversion ────────────────────────────────────────────────────────────────

const todayDate = new Date();
const today = toLocalDateOnly(todayDate);

function toPreviewEvent(evt: PlantEventCreateRequest, idx: number): PlantEventResponse {
  const startDate =
    evt.daysFromNow != null ? addLocalDays(todayDate, evt.daysFromNow) : today;
  const endDate =
    evt.durationDays != null && evt.durationDays > 0
      ? addLocalDays(startDate, evt.durationDays - 1)
      : startDate;

  return {
    id: `preview-${idx}`,
    plantId: '',
    farmPlotId: null,
    farmZoneId: null,
    eventType: evt.eventType,
    note: evt.note ?? null,
    description: evt.description ?? null,
    daysFromNow: evt.daysFromNow ?? null,
    durationDays: evt.durationDays ?? null,
    planned: true,
    calculatedStartDate: startDate,
    calculatedEndDate: endDate,
    phiDays: null,
    ppeRequired: null,
    mrlNote: null,
    estimatedCost: evt.estimatedCost ?? null,
    sourcePlanId: null,
    createdAt: null,
    lastModifiedAt: null,
    createdBy: null,
    lastModifiedBy: null,
    active: true,
  };
}

// ── PlanPreviewCalendar ───────────────────────────────────────────────────────

interface Props {
  draftEvents: PlantEventCreateRequest[];
}

export function PlanPreviewCalendar({ draftEvents }: Props) {
  const events = useMemo(
    () => draftEvents.map((evt, i) => toPreviewEvent(evt, i)),
    [draftEvents],
  );

  if (draftEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
        <CalendarDays className="mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-slate-500">Chưa có sự kiện nào để xem trước.</p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Thêm sự kiện trong tab "Lịch trình" để xem bố cục theo tháng.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-100 p-3">
      <CalendarWorkspace events={events} splitterRange={[28, 75]} />
    </div>
  );
}
