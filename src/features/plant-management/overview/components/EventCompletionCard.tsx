import { useTranslation } from '../../../../i18n';

interface EventCompletionCardProps {
  completed: number;
  pending: number;
  titleKey: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function EventCompletionCard({
  completed,
  pending,
  titleKey,
  gradientFrom = '#10B981',
  gradientTo = '#059669',
}: EventCompletionCardProps) {
  const { t } = useTranslation();
  const total = completed + pending;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const size = 72;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      style={{
        borderRadius: '14px',
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.04)',
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#completionGrad_${titleKey.replace(/\./g, '_')})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
          <defs>
            <linearGradient
              id={`completionGrad_${titleKey.replace(/\./g, '_')}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
            {pct}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
          {t(titleKey)}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', fontWeight: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: gradientFrom, flexShrink: 0 }} />
            <span style={{ color: '#64748b' }}>
              {t('plantManagement.overview.completedLabel')} ({completed})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
            <span style={{ color: '#94a3b8' }}>
              {t('plantManagement.overview.pendingLabel')} ({pending})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
