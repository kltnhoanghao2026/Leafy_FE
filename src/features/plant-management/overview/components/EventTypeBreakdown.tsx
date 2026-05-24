import { useTranslation } from '../../../../i18n';
import type { PlantEventType } from '../../shared/types';

interface EventTypeBreakdownProps {
  eventsByType: Record<string, number>;
  titleKey?: string;
}

const TYPE_COLORS: Record<string, string> = {
  IRRIGATION: '#3B82F6',
  NUTRITION: '#10B981',
  WEED_CONTROL: '#F59E0B',
  PRUNING: '#8B5CF6',
  SCOUTING: '#06B6D4',
  DISEASE_DETECTED: '#EF4444',
  TREATMENT_APPLICATION: '#EC4899',
  QUARANTINE: '#F97316',
  HEALTH_RECOVERY: '#14B8A6',
  PHENOLOGY: '#6366F1',
  REPOT: '#A855F7',
  HARVEST: '#84CC16',
  ALERT_TRIGGERED: '#EF4444',
};

export function EventTypeBreakdown({ eventsByType, titleKey = 'plantManagement.overview.eventsByTypeTitle' }: EventTypeBreakdownProps) {
  const { t } = useTranslation();

  const entries = Object.entries(eventsByType)
    .sort(([, a], [, b]) => b - a);
  const maxCount = entries.length > 0 ? entries[0][1] : 1;

  if (entries.length === 0) {
    return (
      <div
        style={{
          borderRadius: '14px',
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          height: '100%',
        }}
      >
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
            {t(titleKey)}
          </h3>
          <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            {t('plantManagement.overview.recentActivityEmpty')}
          </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: '14px',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.04)',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 900, color: '#0f172a', flexShrink: 0 }}>
        {t(titleKey)}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0, overflow: 'auto' }}>
        {entries.map(([type, count]) => {
          const color = TYPE_COLORS[type] ?? '#94a3b8';
          const pct = Math.round((count / maxCount) * 100);
          const label = t(`plantManagement.eventType.${type}` as `plantManagement.eventType.${PlantEventType}`);

          return (
            <div key={type}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                  {label}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color }}>
                  {count}
                </span>
              </div>
              <div
                style={{
                  height: '5px',
                  borderRadius: '3px',
                  background: '#f1f5f9',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: '3px',
                    background: color,
                    width: `${pct}%`,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
