import { Leaf, MapPin } from 'lucide-react';

interface ScopeProgressBarProps {
  done: number;
  total: number;
  isZone: boolean;
  dotColor: string;
}

export function ScopeProgressBar({ done, total, isZone, dotColor }: ScopeProgressBarProps) {
  const allDone = done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const label = isZone ? 'vùng' : 'cây';
  const Icon = isZone ? MapPin : Leaf;

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0" style={{ color: allDone ? '#10B981' : dotColor }} />
      <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: allDone ? '#10B981' : dotColor,
          }}
        />
      </div>
      <span
        className="text-[10px] font-black tabular-nums"
        style={{ color: allDone ? '#10B981' : dotColor }}
      >
        {done}/{total} {label}
      </span>
    </div>
  );
}
