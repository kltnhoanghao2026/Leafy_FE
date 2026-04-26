import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { useMyProfile } from "../../settings/queries";
import {
  usePlantEventsCalendar,
  usePlants,
  useUpdatePlantEventMutation,
} from "../queries";
import { PlantEventEditDialog } from "../components/PlantEventEditDialog";
import { EVENT_TYPE_LABELS, formatDate } from "../components/displayUtils";
import type { PlantEventResponse } from "../types";

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
};

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const today = new Date();
const initialWeekStart = startOfWeek(today);

export function PlantEventsCalendarPage() {
  const location = useLocation();
  const routeFilters = (location.state as {
    filters?: { plantId?: string; farmPlotId?: string; farmZoneId?: string };
  } | null)?.filters;
  const [weekStart, setWeekStart] = useState(toDateOnly(initialWeekStart));
  const [startDate, setStartDate] = useState(toDateOnly(initialWeekStart));
  const [endDate, setEndDate] = useState(addDays(initialWeekStart, 6));
  const [farmPlotId, setFarmPlotId] = useState(routeFilters?.farmPlotId ?? "");
  const [farmZoneId, setFarmZoneId] = useState(routeFilters?.farmZoneId ?? "");
  const [plantId, setPlantId] = useState(routeFilters?.plantId ?? "");
  const [editEventTarget, setEditEventTarget] =
    useState<PlantEventResponse | null>(null);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery = usePlants();
  const updateEvent = useUpdatePlantEventMutation();
  const calendarQuery = usePlantEventsCalendar({
    startDate,
    endDate,
    farmPlotId: farmPlotId || undefined,
    farmZoneId: farmZoneId || undefined,
    plantId: plantId || undefined,
  });

  const events = useMemo(() => calendarQuery.data ?? [], [calendarQuery.data]);
  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plantById = useMemo(
    () => new Map(plants.map((plant) => [plant.id, plant])),
    [plants],
  );
  const plotById = useMemo(
    () => new Map((plotsQuery.data ?? []).map((plot) => [plot.id, plot])),
    [plotsQuery.data],
  );
  const zoneById = useMemo(
    () => new Map((zonesQuery.data ?? []).map((zone) => [zone.id, zone])),
    [zonesQuery.data],
  );
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, typeof events>();
    events.forEach((event) => {
      const key = event.calculatedStartDate || "Chưa có ngày";
      groups.set(key, [...(groups.get(key) ?? []), event]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);
  const weekDays = useMemo(() => {
    const base = parseDateOnly(weekStart);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(base, index);
      return {
        date,
        label: formatDate(date),
        weekday: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index],
      };
    });
  }, [weekStart]);
  const eventsByDate = useMemo(() => {
    const groups = new Map<string, typeof events>();
    events.forEach((event) => {
      const key = event.calculatedStartDate || "unknown";
      groups.set(key, [...(groups.get(key) ?? []), event]);
    });
    return groups;
  }, [events]);

  const moveWeek = (offset: number) => {
    const nextWeekStart = addDays(parseDateOnly(weekStart), offset * 7);
    setWeekStart(nextWeekStart);
    setStartDate(nextWeekStart);
    setEndDate(addDays(parseDateOnly(nextWeekStart), 6));
  };

  const resetToCurrentWeek = () => {
    const currentWeekStart = toDateOnly(startOfWeek(new Date()));
    setWeekStart(currentWeekStart);
    setStartDate(currentWeekStart);
    setEndDate(addDays(parseDateOnly(currentWeekStart), 6));
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
          Plant events
        </p>
        <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
          Lịch chăm sóc
        </h2>
        <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
          Xem lịch chăm sóc/can thiệp được backend sinh từ treatment plan hoặc ghi nhận cho cây.
        </p>
      </header>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Từ ngày</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setWeekStart(toDateOnly(startOfWeek(parseDateOnly(event.target.value))));
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Đến ngày</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Vườn</span>
            <select
              value={farmPlotId}
              onChange={(event) => {
                setFarmPlotId(event.target.value);
                setFarmZoneId("");
              }}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            >
              <option value="">Tất cả vườn</option>
              {(plotsQuery.data ?? []).map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Khu vực</span>
            <select
              value={farmZoneId}
              onChange={(event) => setFarmZoneId(event.target.value)}
              disabled={!farmPlotId}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 disabled:text-slate-400"
            >
              <option value="">{farmPlotId ? "Tất cả khu vực" : "Chọn vườn trước"}</option>
              {(zonesQuery.data ?? []).map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.zoneName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Cây</span>
            <select
              value={plantId}
              onChange={(event) => setPlantId(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            >
              <option value="">Tất cả cây</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.nickName || plant.plantNumber || plant.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
              Week view
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              Tuần {formatDate(startDate)} - {formatDate(endDate)}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              Tuần trước
            </button>
            <button
              type="button"
              onClick={resetToCurrentWeek}
              className="rounded-2xl border border-[#245A34] bg-green-50 px-4 py-2 text-sm font-bold text-[#245A34]"
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => moveWeek(1)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              Tuần sau
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dayEvents = eventsByDate.get(day.date) ?? [];
            return (
              <div
                key={day.date}
                className="min-h-40 rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mb-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {day.weekday}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {day.label}
                  </p>
                </div>
                <div className="space-y-2">
                  {dayEvents.length ? (
                    dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setEditEventTarget(event)}
                        className="w-full rounded-xl bg-white p-3 text-left text-xs font-bold text-slate-700 shadow-sm hover:bg-emerald-50"
                      >
                        <span className="block font-black text-[#245A34]">
                          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                        </span>
                        <span className="mt-1 block truncate">
                          {event.note || event.description || "Không có mô tả"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs font-bold text-slate-400">
                      Trống
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {calendarQuery.isLoading ? (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
          Đang tải lịch chăm sóc...
        </div>
      ) : null}

      {calendarQuery.isError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6">
          <p className="text-sm font-bold text-red-700">Không tải được lịch chăm sóc.</p>
          <button
            type="button"
            onClick={() => void calendarQuery.refetch()}
            className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải lại
          </button>
        </div>
      ) : null}

      {!calendarQuery.isLoading && !calendarQuery.isError && groupedEvents.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-xl font-black text-slate-900">
            Không có lịch trong khoảng đã chọn
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Thử mở rộng khoảng ngày hoặc bỏ bớt bộ lọc.
          </p>
        </div>
      ) : null}

      <div className="space-y-5">
        {groupedEvents.map(([date, items]) => (
          <section key={date} className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">{formatDate(date)}</h3>
            <div className="mt-4 space-y-3">
              {items.map((event) => {
                const plant = event.plantId ? plantById.get(event.plantId) : null;
                return (
                  <article key={event.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {event.note || event.description || "Không có mô tả"}
                        </p>
                        <p className="mt-2 text-xs font-bold text-slate-400">
                          {plant?.nickName || plant?.plantNumber || event.plantId || "Không gắn cây"} · {event.farmPlotId || "Không gắn vườn"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                        {event.planned ? "Đã lên lịch" : "Đã ghi nhận"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">
                        {event.farmPlotId
                          ? plotById.get(event.farmPlotId)?.name || event.farmPlotId
                          : "Không gắn vườn"}
                        {" · "}
                        {event.farmZoneId
                          ? zoneById.get(event.farmZoneId)?.zoneName || event.farmZoneId
                          : "Không gắn khu"}
                        {event.sourcePlanId ? ` · Source plan: ${event.sourcePlanId}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditEventTarget(event)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
                      >
                        Chỉnh sửa event
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {editEventTarget ? (
        <PlantEventEditDialog
          event={editEventTarget}
          isSubmitting={updateEvent.isPending}
          onClose={() => setEditEventTarget(null)}
          onSubmit={(payload) =>
            void updateEvent
              .mutateAsync({ eventId: editEventTarget.id, payload })
              .then(() => setEditEventTarget(null))
          }
        />
      ) : null}
    </div>
  );
}

export default PlantEventsCalendarPage;
