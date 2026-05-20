import { Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from '../../../../i18n';
import { usePlantEventsCalendar } from '../..';
import { useAgricultureStats } from '../queries/stats.queries';
import type { PlantEventResponse } from '../../shared/types';
import { PlantEventProgressModal } from '../components/PlantEventProgressModal';
import { StatsGrid } from '../components/StatsGrid';
import { EventCompletionCard } from '../components/EventCompletionCard';
import { EventTypeBreakdown } from '../components/EventTypeBreakdown';
import { MonthStatsPanel } from '../components/MonthStatsPanel';
import { GroupedEventList } from '../../calendarview/components/GroupedEventList';
import { PlantEventEditDialog } from '../../calendarview/components/PlantEventEditDialog';
import { DeleteEventModal } from '../../calendarview/components/DeleteEventModal';
import {
  useUpdatePlantEventMutation,
  useToggleTaskMutation,
  useDeletePlantEventMutation,
} from '../../calendarview/queries';
import { toLocalDateOnly } from '../../shared/utils/dateOnly';

export function AgricultureOverviewPage() {
  const { t } = useTranslation();
  const todayString = toLocalDateOnly(new Date());
  const [selectedEvent, setSelectedEvent] = useState<PlantEventResponse | null>(null);
  const [editEventTarget, setEditEventTarget] = useState<PlantEventResponse | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<PlantEventResponse | null>(null);

  const statsQuery = useAgricultureStats();
  const todayEventsQuery = usePlantEventsCalendar({
    startDate: todayString,
    endDate: todayString,
  });

  const stats = statsQuery.data;
  const todayEvents = todayEventsQuery.data ?? [];

  const toggleComplete = useUpdatePlantEventMutation();
  const toggleTask = useToggleTaskMutation();
  const updateMutation = useUpdatePlantEventMutation();
  const deleteMutation = useDeletePlantEventMutation();

  const handleToggleComplete = (event: PlantEventResponse) => {
    void toggleComplete.mutateAsync({
      eventId: event.id,
      payload: { completed: !event.completed },
    });
  };
  const handleToggleTask = (event: PlantEventResponse, taskIndex: number) => {
    void toggleTask.mutateAsync({ eventId: event.id, taskIndex });
  };

  const handleEdit = (event: PlantEventResponse) => {
    setSelectedEvent(null);
    setEditEventTarget(event);
  };

  const handleDelete = (event: PlantEventResponse) => {
    setSelectedEvent(null);
    setDeleteEventTarget(event);
  };

  return (
    <>
      <div
        className="agri-overview"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div>
              <p style={{
                margin: 0,
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.24em',
                color: '#245A34',
              }}>
                {t('plantManagement.overview.pageTag')}
              </p>
              <h2 style={{
                margin: '4px 0 0',
                fontSize: '22px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: '#0f172a',
              }}>
                {t('plantManagement.overview.pageTitle')}
              </h2>
              <p style={{
                margin: '2px 0 0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
              }}>
                {t('plantManagement.overview.pageSubtitle')}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {([
                [t('plantManagement.overview.diagnosisLink'), '/dashboard/disease-diagnosis'],
                [t('plantManagement.overview.askAiLink'), '/dashboard/rag-panel'],
                [t('plantManagement.overview.viewCalendarLink'), '/dashboard/plant-events-calendar'],
              ] as [string, string][]).map(([label, path]) => (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155',
                    textDecoration: 'none',
                    background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s',
                  }}
                  className="quick-link-btn"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* ── Loading / Error States ──────────────────────────────────────── */}
        {statsQuery.isLoading && (
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '64px',
                  borderRadius: '14px',
                  background: '#f1f5f9',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {statsQuery.isError && (
          <div style={{
            flexShrink: 0,
            borderRadius: '14px',
            border: '1px solid #fecaca',
            background: '#fef2f2',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#b91c1c',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            {t('plantManagement.overview.statsLoadError')}
            <button
              type="button"
              onClick={() => void statsQuery.refetch()}
              style={{
                borderRadius: '8px',
                background: '#fecaca',
                border: 'none',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#b91c1c',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {stats && (
          <>
            {/* ── Stats Grid ───────────────────────────────────────────── */}
            <div style={{ flexShrink: 0 }}>
              <StatsGrid stats={stats} />
            </div>

            {/* ── Main content: 3-column grid filling remaining height ── */}
            <div
              className="main-content-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Left column: Month stats + Today's Tasks (GroupedEventList) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ flexShrink: 0 }}>
                  <MonthStatsPanel
                    monthEvents={stats.monthEvents}
                    monthCompletedEvents={stats.monthCompletedEvents}
                    monthPendingEvents={stats.monthPendingEvents}
                    monthEventsByType={stats.monthEventsByType}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    borderRadius: '16px',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.04)',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexShrink: 0,
                  }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                      {t('plantManagement.overview.todayTasksTitle')}
                    </h3>
                    <Link
                      to="/dashboard/plant-events-calendar"
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#245A34',
                        textDecoration: 'none',
                      }}
                    >
                      {t('plantManagement.overview.viewAll')}
                    </Link>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {todayEventsQuery.isLoading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} style={{ height: '52px', borderRadius: '12px', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        ))}
                      </div>
                    ) : todayEventsQuery.isError ? (
                      <div style={{ borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', padding: '16px', fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>
                        {t('plantManagement.overview.todayTasksError')}
                      </div>
                    ) : (
                      <GroupedEventList
                        hideHeader
                        events={todayEvents}
                        onToggleComplete={handleToggleComplete}
                        onToggleTask={handleToggleTask}
                        onSelectEvent={setSelectedEvent}
                        emptyNode={
                          <div style={{ borderRadius: '12px', border: '1px dashed #e2e8f0', background: '#f8fafc', padding: '20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
                            {t('plantManagement.overview.todayTasksEmpty')}
                          </div>
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Middle column: Today's completion ring + Overall event breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0, overflow: 'hidden' }}>
                <div style={{ flexShrink: 0 }}>
                  <EventCompletionCard
                    completed={stats.todayCompletedEvents}
                    pending={stats.todayEvents - stats.todayCompletedEvents}
                    titleKey="plantManagement.overview.completionTitle"
                    gradientFrom="#8B5CF6"
                    gradientTo="#7C3AED"
                  />
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <EventTypeBreakdown eventsByType={stats.eventsByType} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedEvent && (
        <PlantEventProgressModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {editEventTarget && (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateMutation.isPending}
          onClose={() => setEditEventTarget(null)}
          zIndex="z-[60]"
          onSubmit={payload =>
            void updateMutation
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      )}

      {deleteEventTarget && (
        <DeleteEventModal
          event={deleteEventTarget}
          onClose={() => setDeleteEventTarget(null)}
          zIndex="z-[60]"
        />
      )}

      <style>{`
        .quick-link-btn:hover {
          background: #f8fafc !important;
          border-color: #245A34 !important;
          color: #245A34 !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 1024px) {
          .main-content-row { grid-template-columns: 1fr !important; overflow: auto !important; }
        }
      `}</style>
    </>
  );
}

export default AgricultureOverviewPage;
