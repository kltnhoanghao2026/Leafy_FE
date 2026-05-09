import {
  Sprout, Home, CalendarDays, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import type { AgricultureStatsResponse } from '../../shared/types';

interface StatsGridProps {
  stats: AgricultureStatsResponse;
}

const CARDS = [
  {
    key: 'plants',
    icon: Sprout,
    labelKey: 'plantManagement.overview.statsPlants',
    getValue: (s: AgricultureStatsResponse) => s.activePlants,
    subValue: (s: AgricultureStatsResponse) => `/ ${s.totalPlants}`,
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bgLight: 'rgba(16,185,129,0.08)',
    color: '#10B981',
  },
  {
    key: 'farms',
    icon: Home,
    labelKey: 'plantManagement.overview.statsFarms',
    getValue: (s: AgricultureStatsResponse) => s.totalFarmPlots,
    subValue: (s: AgricultureStatsResponse) =>
      s.totalFarmZones > 0 ? `${s.totalFarmZones} zones` : '',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    bgLight: 'rgba(59,130,246,0.08)',
    color: '#3B82F6',
  },
  {
    key: 'today',
    icon: CalendarDays,
    labelKey: 'plantManagement.overview.statsTodayEvents',
    getValue: (s: AgricultureStatsResponse) => s.todayEvents,
    subValue: (s: AgricultureStatsResponse) =>
      s.todayCompletedEvents > 0
        ? `${s.todayCompletedEvents} ✓`
        : '',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    bgLight: 'rgba(139,92,246,0.08)',
    color: '#8B5CF6',
  },
  {
    key: 'overdue',
    icon: AlertTriangle,
    labelKey: 'plantManagement.overview.statsOverdue',
    getValue: (s: AgricultureStatsResponse) => s.overdueEvents,
    subValue: () => '',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    bgLight: 'rgba(239,68,68,0.08)',
    color: '#EF4444',
  },
] as const;

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
      }}
      className="stats-grid"
    >
      {CARDS.map(({ key, icon: Icon, labelKey, getValue, subValue, gradient, bgLight, color }) => (
        <div
          key={key}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '14px',
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.04)',
            padding: '14px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          className="stats-card"
        >
          {/* Accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: gradient,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                flexShrink: 0,
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: bgLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon style={{ width: '16px', height: '16px', color }} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                }}
              >
                {t(labelKey)}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '1px' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#0f172a',
                    lineHeight: 1,
                  }}
                >
                  {getValue(stats)}
                </span>
                {subValue(stats) && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#94a3b8',
                    }}
                  >
                    {subValue(stats)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
        .stats-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}
