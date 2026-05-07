import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFarmPlots, useFarmZones } from '../../../farm-management/queries';
import { useMyProfile } from '../../../settings/queries';
import {
  usePlantEventsCalendar,
  usePlants,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from '../..';
import { useMyPlans } from '../../plan/queries/plan.queries';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { CalendarWorkspace, type CalendarDateRange } from '../../calendarview/components/CalendarWorkspace';
import { PlantEventProgressModal } from '../../overview/components/PlantEventProgressModal';
import { Select } from '../../../../components/ui/Select';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';
import type { PlantEventResponse } from '../../shared/types';

const todayDate = new Date();

function getInitialMonthBounds() {
  const y = todayDate.getFullYear();
  const m = todayDate.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate:   toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}

// ── PlantEventsCalendarPage ───────────────────────────────────────────────────

export function PlantEventsCalendarPage() {
  const location = useLocation();
  const routeFilters = (location.state as { filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string } } | null)?.filters;

  const [farmPlotId,   setFarmPlotId]   = useState(routeFilters?.farmPlotId ?? '');
  const [farmZoneId,   setFarmZoneId]   = useState(routeFilters?.farmZoneId ?? '');
  const [plantId,      setPlantId]      = useState(routeFilters?.plantId    ?? '');
  const [sourcePlanId, setSourcePlanId] = useState('');

  const initialBounds = useMemo(getInitialMonthBounds, []);
  const [dateRange, setDateRange] = useState<CalendarDateRange>({
    startDate: initialBounds.startDate,
    endDate:   initialBounds.endDate,
    activeView: 'month',
  });

  const profileQuery   = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';
  const plotsQuery     = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery     = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery    = usePlants();
  const plansQuery     = useMyPlans({ status: 'ACTIVE' });
  const updateEvent    = useUpdatePlantEventMutation();
  const toggleTask     = useToggleTaskMutation();

  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);
  const [selectedEvent,   setSelectedEvent]   = useState<PlantEventResponse | null>(null);

  const calendarQuery = usePlantEventsCalendar({
    startDate:    dateRange.startDate,
    endDate:      dateRange.endDate,
    farmPlotId:   farmPlotId    || undefined,
    farmZoneId:   farmZoneId    || undefined,
    plantId:      plantId       || undefined,
    sourcePlanId: sourcePlanId  || undefined,
  });

  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#245A34]">Plant events</p>
        <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Lịch chăm sóc</h2>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vườn</span>
          <Select
            className="mt-1"
            value={farmPlotId}
            onChange={v => { setFarmPlotId(String(v)); setFarmZoneId(''); }}
            placeholder="Tất cả vườn"
            options={[
              { value: '', label: 'Tất cả vườn' },
              ...(plotsQuery.data ?? []).map(p => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Khu vực</span>
          <Select
            className="mt-1"
            value={farmZoneId}
            onChange={v => setFarmZoneId(String(v))}
            disabled={!farmPlotId}
            placeholder={farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước'}
            options={[
              { value: '', label: farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước' },
              ...(zonesQuery.data ?? []).map(z => ({ value: z.id, label: z.zoneName })),
            ]}
          />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cây</span>
          <Select
            className="mt-1"
            value={plantId}
            onChange={v => setPlantId(String(v))}
            placeholder="Tất cả cây"
            options={[
              { value: '', label: 'Tất cả cây' },
              ...(plantsQuery.data ?? []).map(p => ({
                value: p.id,
                label: p.nickName || p.plantNumber || p.id,
              })),
            ]}
          />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Kế hoạch</span>
          <Select
            className="mt-1"
            value={sourcePlanId}
            onChange={v => setSourcePlanId(String(v))}
            placeholder="Tất cả kế hoạch"
            options={[
              { value: '', label: 'Tất cả kế hoạch' },
              ...(plansQuery.data?.content ?? []).map(p => ({
                value: p.id,
                label: p.planName || p.diseaseName || p.id,
              })),
            ]}
          />
        </div>
      </div>

      {/* Shared calendar workspace */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CalendarWorkspace
          events={events}
          calendarQuery={calendarQuery}
          onDateRangeChange={setDateRange}
          onEditEvent={setEditEventTarget}
          onToggleComplete={(event) =>
            void updateEvent.mutateAsync({ eventId: event.id, payload: { completed: !event.completed } })
          }
          onToggleTask={(event, idx) =>
            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
          }
          onSelectEvent={setSelectedEvent}
        />
      </div>

      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          onSubmit={payload =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
      {selectedEvent && (
        <PlantEventProgressModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

export default PlantEventsCalendarPage;
