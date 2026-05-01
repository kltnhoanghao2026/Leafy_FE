import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronDown } from "lucide-react";

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  type?: "date" | "datetime-local";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(date: Date, timeStr: string) {
  return `${formatDate(date)}T${timeStr}`;
}

export function DatePicker({
  value = "",
  onChange,
  type = "date",
  placeholder = "Chọn ngày...",
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const isDateTime = value.includes("T");
    const datePart = isDateTime ? value.split("T")[0] : value;
    const timePart = isDateTime ? value.split("T")[1].substring(0, 5) : "00:00";
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return null;
    return { date: new Date(y, m - 1, d), time: timePart };
  }, [value]);

  const [viewDate, setViewDate] = useState(() => {
    return parsedValue?.date || new Date();
  });

  const [tempTime, setTempTime] = useState(parsedValue?.time || "00:00");

  useEffect(() => {
    if (parsedValue) {
      setViewDate(parsedValue.date);
      setTempTime(parsedValue.time);
    }
  }, [parsedValue]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (dayObj: Date) => {
    if (type === "datetime-local") {
      onChange?.(formatDateTime(dayObj, tempTime));
    } else {
      onChange?.(formatDate(dayObj));
      setIsOpen(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTempTime(newTime);
    if (parsedValue?.date) {
      onChange?.(formatDateTime(parsedValue.date, newTime));
    }
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7; // Convert Sunday=0 to Monday=0
    const daysInMonth = getDaysInMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);

    const days = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill 42 slots (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewDate]);

  const displayValue = useMemo(() => {
    if (!parsedValue) return "";
    const y = parsedValue.date.getFullYear();
    const m = String(parsedValue.date.getMonth() + 1).padStart(2, "0");
    const d = String(parsedValue.date.getDate()).padStart(2, "0");
    if (type === "datetime-local") {
      return `${d}/${m}/${y} ${parsedValue.time}`;
    }
    return `${d}/${m}/${y}`;
  }, [parsedValue, type]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 focus:border-[#245A34] focus:outline-none focus:ring-1 focus:ring-[#245A34]"
      >
        <span className={!displayValue ? "text-slate-400" : ""}>
          {displayValue || placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <select
                  value={viewDate.getMonth()}
                  onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:bg-emerald-50 hover:text-[#245A34] hover:border-emerald-200 focus:border-[#245A34] focus:ring-1 focus:ring-[#245A34] transition-colors shadow-sm"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>Tháng {i + 1}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative flex items-center">
                <select
                  value={viewDate.getFullYear()}
                  onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg pl-3 pr-8 py-1.5 outline-none cursor-pointer hover:bg-emerald-50 hover:text-[#245A34] hover:border-emerald-200 focus:border-[#245A34] focus:ring-1 focus:ring-[#245A34] transition-colors shadow-sm"
                >
                  {Array.from({ length: 100 }).map((_, i) => {
                    const y = new Date().getFullYear() - 50 + i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const isSelected =
                parsedValue?.date &&
                day.date.getFullYear() === parsedValue.date.getFullYear() &&
                day.date.getMonth() === parsedValue.date.getMonth() &&
                day.date.getDate() === parsedValue.date.getDate();

              const isToday =
                new Date().getFullYear() === day.date.getFullYear() &&
                new Date().getMonth() === day.date.getMonth() &&
                new Date().getDate() === day.date.getDate();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateSelect(day.date);
                  }}
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors
                    ${!day.isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                    ${isSelected ? "bg-[#245A34] text-white" : "hover:bg-emerald-50 hover:text-[#245A34]"}
                    ${isToday && !isSelected ? "ring-1 ring-[#245A34] text-[#245A34]" : ""}
                  `}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          {type === "datetime-local" && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-sm font-bold text-slate-600">
                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                Thời gian
              </div>
              <input
                type="time"
                value={tempTime}
                onChange={handleTimeChange}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-[#245A34]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
