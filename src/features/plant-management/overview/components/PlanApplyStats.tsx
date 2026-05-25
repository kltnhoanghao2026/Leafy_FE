import { ClipboardCheck, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from '../../../../i18n';

interface PlanApplyStatsProps {
  activePlanApplies: number;
  completedPlanApplies: number;
  totalPlans: number;
  upcomingEvents7d: number;
}

export function PlanApplyStats({
  activePlanApplies,
  completedPlanApplies,
  totalPlans,
  upcomingEvents7d,
}: PlanApplyStatsProps) {
  const { t } = useTranslation();

  const items = [
    {
      icon: ClipboardCheck,
      label: t('plantManagement.overview.statsActivePlans'),
      value: activePlanApplies,
      color: '#8B5CF6',
    },
    {
      icon: CheckCircle2,
      label: t('plantManagement.overview.statsCompletedPlans'),
      value: completedPlanApplies,
      color: '#10B981',
    },
    {
      icon: Clock,
      label: t('plantManagement.overview.statsUpcoming'),
      value: upcomingEvents7d,
      color: '#3B82F6',
    },
  ];

  return (
    <div
      style={{
        borderRadius: '14px',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.04)',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
        {t('plantManagement.overview.planStatsTitle')}
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginLeft: '6px' }}>
          ({totalPlans})
        </span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: `${item.color}08`,
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${item.color}14`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <item.icon style={{ width: '14px', height: '14px', color: item.color }} />
            </div>
            <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              {item.label}
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: item.color,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
