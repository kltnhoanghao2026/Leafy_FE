import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, List, Info } from "lucide-react";

type JsonRecord = Record<string, unknown>;

const asPlanString = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const asPlanNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const EVENT_TYPE_COLORS: Record<string, string> = {
  IRRIGATION: "bg-blue-100 text-blue-700",
  NUTRITION: "bg-lime-100 text-lime-700",
  WEED_CONTROL: "bg-yellow-100 text-yellow-700",
  PRUNING: "bg-orange-100 text-orange-700",
  SCOUTING: "bg-teal-100 text-teal-700",
  DISEASE_DETECTED: "bg-red-100 text-red-700",
  TREATMENT_APPLICATION: "bg-purple-100 text-purple-700",
  QUARANTINE: "bg-rose-100 text-rose-700",
  HEALTH_RECOVERY: "bg-emerald-100 text-emerald-700",
  PHENOLOGY: "bg-indigo-100 text-indigo-700",
  REPOT: "bg-cyan-100 text-cyan-700",
  HARVEST: "bg-amber-100 text-amber-700",
};

const EVENT_DOT_COLORS: Record<string, string> = {
  IRRIGATION: "bg-blue-500",
  NUTRITION: "bg-lime-500",
  WEED_CONTROL: "bg-yellow-500",
  PRUNING: "bg-orange-500",
  SCOUTING: "bg-teal-500",
  DISEASE_DETECTED: "bg-red-500",
  TREATMENT_APPLICATION: "bg-purple-500",
  QUARANTINE: "bg-rose-500",
  HEALTH_RECOVERY: "bg-emerald-500",
  PHENOLOGY: "bg-indigo-500",
  REPOT: "bg-cyan-500",
  HARVEST: "bg-amber-500",
};

const getEventColor = (type: string): string =>
  EVENT_TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600";

const getDotColor = (type: string): string =>
  EVENT_DOT_COLORS[type] ?? "bg-slate-400";

interface TreatmentPlanCalendarProps {
  schedule: JsonRecord[];
}

export function TreatmentPlanCalendar({ schedule }: TreatmentPlanCalendarProps) {
  // Find the initial month based on the first event in the schedule, or current date
  const initialDate = useMemo(() => {
    if (schedule.length > 0) {
      const firstEventDateStr = asPlanString(schedule[0].calculatedStartDate);
      if (firstEventDateStr) {
        const d = new Date(firstEventDateStr);
        if (!isNaN(d.getTime())) {
          return d;
        }
      }
    }
    return new Date();
  }, [schedule]);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDateUrl, setSelectedDateUrl] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDateUrl(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDateUrl(null);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, JsonRecord[]>();
    for (const ev of schedule) {
      const dStr = asPlanString(ev.calculatedStartDate);
      if (!dStr) continue;
      // We assume calculatedStartDate is YYYY-MM-DD or standard ISO
      const d = new Date(dStr);
      if (isNaN(d.getTime())) continue;
      
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(ev);
    }
    return map;
  }, [schedule]);

  // Generate calendar grid
  const days = [];
  // Fill preceding blanks
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-pre-${i}`} className="h-12 border-b border-r border-slate-100 bg-slate-50/50" />);
  }
  
  // Fill actual days
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = selectedDateUrl === `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isToday = dateKey === todayKey;
    const dayEvents = eventsByDate.get(dateKey) || [];

    // unique colored dots
    const uniqueColors = Array.from(new Set(dayEvents.map(ev => getDotColor(asPlanString(ev.eventType))))).slice(0, 3);
    const hasMore = dayEvents.length > 3;

    days.push(
      <button
        key={`day-${i}`}
        onClick={() => setSelectedDateUrl(dateKey)}
        className={`h-12 border-b border-r border-slate-100 flex flex-col items-center justify-start pt-1 pb-1 transition-colors relative hover:bg-slate-50
          ${isSelected ? "bg-emerald-50" : "bg-white"}
        `}
      >
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
            ${isSelected ? "bg-emerald-600 text-white" : isToday ? "bg-emerald-100 text-emerald-700" : "text-slate-700"}
          `}
        >
          {i}
        </div>
        <div className="flex flex-row items-center justify-center gap-0.5 mt-1">
          {uniqueColors.map((color, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${color}`} />
          ))}
          {hasMore && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
        </div>
      </button>
    );
  }

  // Fill trailing blanks
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    days.push(<div key={`empty-post-${i}`} className="h-12 border-b border-r border-slate-100 bg-slate-50/50" />);
  }

  const selectedDayEvents = selectedDateUrl ? (eventsByDate.get(selectedDateUrl) || []) : [];
  
  const upcomingEvents = useMemo(() => {
    // Only return events from today onwards
    const allEvents = schedule.filter(ev => {
      const dStr = asPlanString(ev.calculatedStartDate);
      if (!dStr) return false;
      const d = new Date(dStr);
      return !isNaN(d.getTime());
    });
    
    // Sort
    allEvents.sort((a, b) => {
      return (asPlanString(a.calculatedStartDate) || "").localeCompare(asPlanString(b.calculatedStartDate) || "");
    });
    
    return allEvents.slice(0, 10);
  }, [schedule]);

  const displayedEvents = selectedDateUrl ? selectedDayEvents : upcomingEvents;
  const listTitle = selectedDateUrl 
    ? `Sự kiện ngày ${new Date(selectedDateUrl).toLocaleDateString("vi-VN")}`
    : "Sự kiện lịch trình (Tất cả)";

  return (
    <div className="flex flex-col border border-slate-200 rounded-3xl overflow-hidden bg-white mt-8 shadow-xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">
          Tháng {month + 1}, {year}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d, i) => (
          <div key={i} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-100 flex-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days}
      </div>

      {/* Legend / Selected Detail */}
      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          {listTitle}
        </h3>
        
        {displayedEvents.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 flex flex-col items-center">
            <Info className="w-8 h-8 text-slate-300 mb-2" />
            Không có sự kiện nào.
          </div>
        ) : (
          <div className="space-y-4">
            {displayedEvents.map((ev, idx) => {
              const evType = asPlanString(ev.eventType);
              const note = asPlanString(ev.note);
              const desc = asPlanString(ev.description);
              const startDate = asPlanString(ev.calculatedStartDate);
              const phi = asPlanNumber(ev.phiDays);
              const ppe = asPlanString(ev.ppeRequired);
              const evCost = asPlanString(ev.estimatedCost);

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getEventColor(
                        evType
                      )}`}
                    >
                      {evType.replace(/_/g, " ")}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base">{note || evType}</h4>
                    {startDate && (
                      <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        {startDate}
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-sm text-slate-600 mb-3">{desc}</p>}
                  {(phi !== undefined || ppe || evCost) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {phi !== undefined && (
                        <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-amber-700 font-semibold">
                          PHI: {phi} ngày
                        </span>
                      )}
                      {ppe && (
                        <span className="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-slate-600">
                          PPE: {ppe}
                        </span>
                      )}
                      {evCost && (
                        <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-700 font-semibold shrink-0">
                          Phí: {evCost}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
