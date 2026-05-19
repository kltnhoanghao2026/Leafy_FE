import { useTranslation } from '../../../../i18n';
import { EventCompletionCard } from './EventCompletionCard';

interface MonthStatsPanelProps {
  monthEvents: number;
  monthCompletedEvents: number;
  monthPendingEvents: number;
  monthEventsByType: Record<string, number>;
}

export function MonthStatsPanel({
  monthEvents,
  monthCompletedEvents,
  monthPendingEvents,
  monthEventsByType,
}: MonthStatsPanelProps) {
  const { t } = useTranslation();

  const _entries = Object.entries(monthEventsByType); // reserved for future use

  return (
    <div
      style={{
        borderRadius: '14px',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.04)',
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        gap: '10px',
        alignItems: 'stretch',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <EventCompletionCard
          completed={monthCompletedEvents}
          pending={monthPendingEvents}
          titleKey="plantManagement.overview.monthCompletionTitle"
          gradientFrom="#8B5CF6"
          gradientTo="#7C3AED"
        />
      </div>

      {/* Month summary stats */}
      <div
        style={{
          flex: 1,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(139,92,246,0.1)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C3AED' }}>
          {t('plantManagement.overview.statsMonthEvents')}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {monthEvents}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
            {t('plantManagement.overview.eventsLabel')}
          </span>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
          <span style={{ color: '#10B981', fontWeight: 800 }}>{monthCompletedEvents}</span>
          {' '}{t('plantManagement.overview.completedEventsLabel')}{' · '}
          <span style={{ color: '#F59E0B', fontWeight: 800 }}>{monthPendingEvents}</span>
          {' '}{t('plantManagement.overview.pendingLabel').toLowerCase()}
        </div>
      </div>
    </div>
  );
}
