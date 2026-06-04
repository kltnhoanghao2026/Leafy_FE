import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMyProfile } from '../../../settings/queries';
import {
  usePlantEventsCalendar,
  useToggleTaskMutation,
  useUpdatePlantEventMutation,
} from '../..';
import { useMyApplies } from '../../plan/queries/plan.queries';
import { PlantEventEditDialog } from '../components/PlantEventEditDialog';
import { PlantEventCreateDialog } from '../components/PlantEventCreateDialog';
import { CalendarWorkspace, type CalendarDateRange } from '../components/CalendarWorkspace';
import { PlantEventProgressModal } from '../../overview/components/PlantEventProgressModal';
import { SuccessPromptModal } from '../components/SuccessPromptModal';
import { FilterModal } from '../components/FilterModal';
import { DeleteEventModal } from '../components/DeleteEventModal';
import { getInitialMonthBounds, applyLabel } from '../utils/dateUtils';
import type { PlantEventResponse, PlantEventCreateRequest } from '../../shared/types';
import { Filter, Plus } from 'lucide-react';
import { useCreatePlantEventMutation } from '../queries/plant-event.queries';
import { useTranslation } from '../../../../i18n';

// ── PlantEventsCalendarPage ───────────────────────────────────────────────────

export function PlantEventsCalendarPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const routeFilters = (location.state as {
    filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string };
  } | null)?.filters;

  const [farmPlotId,      setFarmPlotId]      = useState(routeFilters?.farmPlotId ?? '');
  const [farmZoneId,      setFarmZoneId]      = useState(routeFilters?.farmZoneId ?? '');
  const [plantId,         setPlantId]         = useState(routeFilters?.plantId    ?? '');
  const [targetType,       setTargetType]       = useState('');
  const [eventType,        setEventType]        = useState('');
  const [selectedApplyId, setSelectedApplyId] = useState('');

  const initialBounds = useMemo(() => getInitialMonthBounds(), []);
  const [dateRange, setDateRange] = useState<CalendarDateRange>({
    startDate: initialBounds.startDate,
    endDate:   initialBounds.endDate,
    activeView: 'month',
  });

  const profileQuery   = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? '';

  // Fetch ALL applies (active + completed etc.) so users can view historical schedules too
  const appliesQuery = useMyApplies({ size: 100 });
  const applies      = useMemo(() => appliesQuery.data?.content ?? [], [appliesQuery.data]);

  const updateEvent = useUpdatePlantEventMutation();
  const toggleTask  = useToggleTaskMutation();
  const createEvent = useCreatePlantEventMutation();

  const [editEventTarget,   setEditEventTarget]   = useState<PlantEventResponse | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent,     setSelectedEvent]     = useState<PlantEventResponse | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] = useState<PlantEventResponse | null>(null);
  // Triggered when the last event of a PlanApply is completed — shows success prompt
  const [pendingCompleteApply, setPendingCompleteApply] = useState<{
    applyId: string;
    eventId: string;
  } | null>(null);

  const calendarQuery = usePlantEventsCalendar({
    startDate:    dateRange.startDate,
    endDate:      dateRange.endDate,
    profileId:    ownerProfileId      || undefined,
    farmPlotId:   farmPlotId         || undefined,
    farmZoneId:   farmZoneId         || undefined,
    plantId:      plantId            || undefined,
    targetType:   targetType         || undefined,
    eventType:    eventType          || undefined,
    planApplyId:  selectedApplyId    || undefined,
  });

  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);

  /**
   * Handle event completion toggle.
   * After completing, check if this was the last event (backend sets isLastIncompleteEventForApply).
   * If so, trigger the success prompt modal.
   */
  const handleToggleComplete = async (event: PlantEventResponse) => {
    const updated = await updateEvent.mutateAsync({
      eventId: event.id,
      payload: { completed: !event.completed },
    });
    if (updated?.isLastIncompleteEventForApply && updated.planApplyId) {
      setPendingCompleteApply({ applyId: updated.planApplyId, eventId: updated.id });
    }
  };

  // Count active filters
  const activeFilterCount = [
    farmPlotId,
    farmZoneId,
    plantId,
    targetType,
    eventType,
    selectedApplyId,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#245A34]">{t('plantManagement.calendar.pageTag')}</p>
          <h2 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">{t('plantManagement.calendar.pageTitle')}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Create event button */}
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#245A34] rounded-xl hover:bg-[#1e4a2c] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('plantManagement.calendar.createEvent')}</span>
          </button>

          {/* Filter button */}
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Filter className="h-4 w-4" />
            <span>{t('plantManagement.calendar.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-[#245A34] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Shared calendar workspace */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CalendarWorkspace
          events={events}
          calendarQuery={calendarQuery}
          onDateRangeChange={setDateRange}
          onEditEvent={setEditEventTarget}
          onToggleComplete={handleToggleComplete}
          onToggleTask={(event, idx) =>
            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
          }
          onSelectEvent={setSelectedEvent}
          onDelete={setDeleteEventTarget}
        />
      </div>

      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          zIndex="z-[60]"
          onSubmit={payload =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}
      {isCreateDialogOpen && (
        <PlantEventCreateDialog
          isSubmitting={createEvent.isPending}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={(payload: PlantEventCreateRequest) =>
            void createEvent
              .mutateAsync(payload)
              .then(() => setIsCreateDialogOpen(false))
          }
        />
      )}
      {selectedEvent && (
        <PlantEventProgressModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(event) => setEditEventTarget(event)}
          onDelete={(event) => setDeleteEventTarget(event)}
          onToggleTask={(event, idx) =>
            void toggleTask.mutateAsync({ eventId: event.id, taskIndex: idx })
          }
          zIndex="z-[60]"
        />
      )}
      {pendingCompleteApply && (
        <SuccessPromptModal
          applyId={pendingCompleteApply.applyId}
          onClose={() => setPendingCompleteApply(null)}
        />
      )}

      {deleteEventTarget && (
        <DeleteEventModal
          event={deleteEventTarget}
          onClose={() => setDeleteEventTarget(null)}
          zIndex="z-[60]"
        />
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          farmPlotId,
          farmZoneId,
          plantId,
          targetType,
          eventType,
          selectedApplyId,
        }}
        onApply={(newFilters) => {
          setFarmPlotId(newFilters.farmPlotId);
          setFarmZoneId(newFilters.farmZoneId);
          setPlantId(newFilters.plantId);
          setTargetType(newFilters.targetType);
          setEventType(newFilters.eventType);
          setSelectedApplyId(newFilters.selectedApplyId);
        }}
        onClear={() => {
          setFarmPlotId('');
          setFarmZoneId('');
          setPlantId('');
          setTargetType('');
          setEventType('');
          setSelectedApplyId('');
        }}
        applies={applies}
        ownerProfileId={ownerProfileId}
        applyLabel={applyLabel}
      />
    </div>
  );
}

export default PlantEventsCalendarPage;
