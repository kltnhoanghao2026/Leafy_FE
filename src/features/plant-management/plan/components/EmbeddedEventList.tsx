import { CheckCircle2, DollarSign, Leaf, MapPin, ShieldAlert } from "lucide-react";
import { EVENT_TYPE_LABELS } from "../../shared/components/displayUtils";
import type { EmbeddedPlanEventResponse } from "../../shared/types";

interface EmbeddedEventListProps {
  events: EmbeddedPlanEventResponse[];
}

export function EmbeddedEventList({ events }: EmbeddedEventListProps) {
  if (!events || events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-400">
        Chưa có sự kiện nào.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, idx) => (
        <article key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#245A34]/10 text-[#245A34] text-xs font-black">
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                </h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black bg-blue-50 text-blue-600">
                  Bản mẫu
                </span>
                {event.targetType && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black bg-purple-50 text-purple-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.targetType === 'FARM' ? 'Toàn vườn' : event.targetType === 'FARM_ZONE' ? 'Khu vực' : 'Cá thể'}
                  </span>
                )}
              </div>
              {(event.note || event.description) && (
                <p className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">
                  {event.note || event.description}
                </p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ngày (Tương đối)</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">Ngày {event.daysFromStart ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thời gian (ngày)</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{event.durationDays ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 border border-slate-100">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">PHI (ngày)</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{event.phiDays ?? "—"}</p>
                </div>
              </div>
              {(event.ppeRequired || event.mrlNote || event.estimatedCost) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.ppeRequired && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <ShieldAlert className="w-3 h-3" strokeWidth={2.5} />PPE: {event.ppeRequired}
                    </span>
                  )}
                  {event.mrlNote && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      <Leaf className="w-3 h-3" strokeWidth={2.5} />MRL: {event.mrlNote}
                    </span>
                  )}
                  {event.estimatedCost && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      <DollarSign className="w-3 h-3" strokeWidth={2.5} />{event.estimatedCost}
                    </span>
                  )}
                </div>
              )}
              {event.tasks && event.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Công việc chi tiết ({event.tasks.length})</p>
                  <ul className="space-y-2">
                    {event.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-700">{task.title}</p>
                          {task.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{task.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
