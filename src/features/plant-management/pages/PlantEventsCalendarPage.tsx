import { useMemo, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { useMyProfile } from "../../settings/queries";
import { usePlantEventsCalendar, usePlants } from "../queries";
import { EVENT_TYPE_LABELS, formatDate } from "../components/displayUtils";

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const today = new Date();

export function PlantEventsCalendarPage() {
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(addDays(today, 14));
  const [farmPlotId, setFarmPlotId] = useState("");
  const [farmZoneId, setFarmZoneId] = useState("");
  const [plantId, setPlantId] = useState("");

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery = usePlants();
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
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, typeof events>();
    events.forEach((event) => {
      const key = event.calculatedStartDate || "Chưa có ngày";
      groups.set(key, [...(groups.get(key) ?? []), event]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

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
              onChange={(event) => setStartDate(event.target.value)}
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
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default PlantEventsCalendarPage;
