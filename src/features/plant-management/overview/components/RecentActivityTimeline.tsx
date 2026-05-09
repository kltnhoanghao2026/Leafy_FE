import {
  Droplets, Beaker, Trash2, Scissors, Search, Bug, Syringe,
  ShieldAlert, HeartPulse, Activity, PackageOpen, Wheat,
  CheckCircle2, Circle,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import type { RecentEventSummary, PlantEventType } from '../../shared/types';

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  IRRIGATION: Droplets,
  NUTRITION: Beaker,
  WEED_CONTROL: Trash2,
  PRUNING: Scissors,
  SCOUTING: Search,
  DISEASE_DETECTED: Bug,
  TREATMENT_APPLICATION: Syringe,
  QUARANTINE: ShieldAlert,
  HEALTH_RECOVERY: HeartPulse,
  PHENOLOGY: Activity,
  REPOT: PackageOpen,
  HARVEST: Wheat,
};

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
};

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

interface RecentActivityTimelineProps {
  events: RecentEventSummary[];
}

export function RecentActivityTimeline({ events }: RecentActivityTimelineProps) {
  const { t } = useTranslation();

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
        {t('plantManagement.overview.recentActivityTitle')}
      </h3>

      {events.length === 0 ? (
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          {t('plantManagement.overview.recentActivityEmpty')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1, minHeight: 0, overflow: 'auto' }}>
          {events.map((event, idx) => {
            const Icon = EVENT_ICONS[event.eventType] ?? Droplets;
            const color = TYPE_COLORS[event.eventType] ?? '#94a3b8';
            const isLast = idx === events.length - 1;
            const label = t(`plantManagement.eventType.${event.eventType}` as `plantManagement.eventType.${PlantEventType}`);

            return (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  position: 'relative',
                }}
              >
                {/* Timeline line + dot */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '28px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: `${color}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '12px', height: '12px', color }} />
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        width: '1.5px',
                        flex: 1,
                        background: '#e2e8f0',
                        minHeight: '8px',
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : '10px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      {label}
                    </span>
                    {event.completed ? (
                      <CheckCircle2 style={{ width: '12px', height: '12px', color: '#10B981' }} />
                    ) : (
                      <Circle style={{ width: '12px', height: '12px', color: '#cbd5e1' }} />
                    )}
                  </div>
                  {event.note && (
                    <p
                      style={{
                        margin: '1px 0 0',
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
