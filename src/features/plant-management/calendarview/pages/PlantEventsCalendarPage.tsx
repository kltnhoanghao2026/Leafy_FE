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
import { useMyApplies } from '../../plan/queries/plan.queries';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { CalendarWorkspace, type CalendarDateRange } from '../../calendarview/components/CalendarWorkspace';
import { PlantEventProgressModal } from '../../overview/components/PlantEventProgressModal';
import { Select } from '../../../../components/ui/Select';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';
import type { PlantEventResponse, PlanApplyResponse } from '../../shared/types';

const todayDate = new Date();

function getInitialMonthBounds() {
  const y = todayDate.getFullYear();
  const m = todayDate.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate:   toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}

/** Build a human-readable label for a PlanApply */
function applyLabel(apply: PlanApplyResponse): string {
  const shortId = apply.planId.slice(-6);
  const scope = apply.plantId
    ? 'Cây'
    : apply.farmZoneId
    ? 'Khu vực'
    : apply.farmPlotId
    ? 'Vườn'
    : 'Toàn bộ';
  const statusMap: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    APPLYING: 'Đang xử lý',
    ACTIVE: 'Đang áp dụng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  const startLabel = apply.startDate ? ` · ${apply.startDate}` : '';
  return `Kế hoạch ...${shortId} · ${scope}${startLabel} · ${statusMap[apply.status] ?? apply.status}`;
}

// ── PlantEventsCalendarPage ───────────────────────────────────────────────────

export function PlantEventsCalendarPage() {
  const location = useLocation();
  const routeFilters = (location.state as {
    filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string };
  } | null)?.filters;

  const [farmPlotId,      setFarmPlotId]      = useState(routeFilters?.farmPlotId ?? '');
  const [farmZoneId,      setFarmZoneId]      = useState(routeFilters?.farmZoneId ?? '');
  const [plantId,         setPlantId]         = useState(routeFilters?.plantId    ?? '');
  const [selectedApplyId, setSelectedApplyId] = useState('');

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

  // Fetch ALL applies (active + completed etc.) so users can view historical schedules too
  const appliesQuery = useMyApplies({ size: 100 });
  const applies      = useMemo(() => appliesQuery.data?.content ?? [], [appliesQuery.data]);

  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask  = useToggleTaskMutation();

  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);
  const [selectedEvent,   setSelectedEvent]   = useState<PlantEventResponse | null>(null);

  /**
   * When the user selects a PlanApply from the dropdown:
   * - store the apply id directly as planApplyId for the calendar query
   * - auto-fill scope filters (farmPlot, farmZone, plant) from the apply's own scope
   */
  const handleApplyChange = (applyId: string) => {
    setSelectedApplyId(applyId);
    if (!applyId) return;
    const apply = applies.find(a => a.id === applyId);
    if (!apply) return;

    // Auto-fill the narrowest scope the apply has
    if (apply.plantId) {
      setPlantId(apply.plantId);
    }
    if (apply.farmZoneId) {
      setFarmZoneId(apply.farmZoneId);
    }
    if (apply.farmPlotId) {
      setFarmPlotId(apply.farmPlotId);
    }
  };

  /** Clear the apply-driven filters when the user manually changes a scope filter */
  const clearApply = () => setSelectedApplyId('');

  const calendarQuery = usePlantEventsCalendar({
    startDate:    dateRange.startDate,
    endDate:      dateRange.endDate,
    farmPlotId:   farmPlotId        || undefined,
    farmZoneId:   farmZoneId        || undefined,
    plantId:      plantId           || undefined,
    planApplyId:  selectedApplyId   || undefined,
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
        {/* Vườn */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vườn</span>
          <Select
            className="mt-1"
            value={farmPlotId}
            onChange={v => { setFarmPlotId(String(v)); setFarmZoneId(''); clearApply(); }}
            placeholder="Tất cả vườn"
            options={[
              { value: '', label: 'Tất cả vườn' },
              ...(plotsQuery.data ?? []).map(p => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>

        {/* Khu vực */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Khu vực</span>
          <Select
            className="mt-1"
            value={farmZoneId}
            onChange={v => { setFarmZoneId(String(v)); clearApply(); }}
            disabled={!farmPlotId}
            placeholder={farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước'}
            options={[
              { value: '', label: farmPlotId ? 'Tất cả khu vực' : 'Chọn vườn trước' },
              ...(zonesQuery.data ?? []).map(z => ({ value: z.id, label: z.zoneName })),
            ]}
          />
        </div>

        {/* Cây */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cây</span>
          <Select
            className="mt-1"
            value={plantId}
            onChange={v => { setPlantId(String(v)); clearApply(); }}
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

        {/* Áp dụng kế hoạch (PlanApply) */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Áp dụng kế hoạch
          </span>
          <Select
            className="mt-1"
            value={selectedApplyId}
            onChange={v => handleApplyChange(String(v))}
            placeholder={appliesQuery.isLoading ? 'Đang tải...' : 'Tất cả áp dụng'}
            options={[
              { value: '', label: 'Tất cả áp dụng' },
              ...applies.map(a => ({
                value: a.id,
                label: applyLabel(a),
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
