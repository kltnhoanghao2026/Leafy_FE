import { CalendarDays } from "lucide-react";
import type { PlantEventResponse } from "../types";
import { EVENT_TYPE_LABELS, formatDate } from "./displayUtils";

interface PlantEventListProps {
  title: string;
  events: PlantEventResponse[];
  isLoading?: boolean;
  isError?: boolean;
  emptyText?: string;
}

export function PlantEventList({
  title,
  events,
  isLoading = false,
  isError = false,
  emptyText = "Chưa có lịch chăm sóc.",
}: PlantEventListProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-2xl bg-[#EAF3EA] p-3 text-[#245A34]">
          <CalendarDays className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div>
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="text-sm font-semibold text-slate-500">
            Theo dõi các hoạt động chăm sóc và lịch sắp tới.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label={`Đang tải ${title}`}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Không tải được lịch chăm sóc.
        </div>
      ) : null}

      {!isLoading && !isError && events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          {emptyText}
        </div>
      ) : null}

      <div className="space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                </h4>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {event.description || event.note || "Không có mô tả"}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                {event.planned ? "Đã lên lịch" : "Đã ghi nhận"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Bắt đầu
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {formatDate(event.calculatedStartDate)}
                </p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Kết thúc
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {formatDate(event.calculatedEndDate)}
                </p>
              </div>
              <div>
                <p className="font-black uppercase tracking-wide text-slate-400">
                  Chi phí
                </p>
                <p className="mt-1 font-bold text-slate-800">
                  {event.estimatedCost || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
