import { ListChecks } from 'lucide-react';

interface EventProgressBarProps {
  done: number;
  total: number;
  dotColor: string;
  label?: string;
}

export function EventProgressBar({ done, total, dotColor, label }: EventProgressBarProps) {
  const allDone = done === total;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <ListChecks className="h-3 w-3 shrink-0" style={{ color: allDone ? '#10B981' : dotColor }} />
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
        {done}/{total}{label ? ` ${label}` : ''}
      </span>
    </div>
  );
}
