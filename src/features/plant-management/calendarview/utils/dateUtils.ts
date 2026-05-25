import type { PlantEventResponse } from '../../shared/types';
import { addLocalDays, toLocalDateOnly } from '../../shared/utils/dateOnly';

/** Format a date string as DD/MM for compact display. */
export function fmtShortDate(val?: string | null): string | null {
  if (!val) return null;
  const parts = val.slice(0, 10).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return val.slice(5);
}

/** Build events-by-date map, handling multi-day spans. */
export function buildEventsByDate(
  events: PlantEventResponse[],
): Map<string, PlantEventResponse[]> {
  const map = new Map<string, PlantEventResponse[]>();
  for (const evt of events) {
    const start = evt.calculatedStartDate;
    if (!start) continue;
    const end = evt.durationDays != null && evt.durationDays > 0
      ? addLocalDays(start, evt.durationDays - 1)
      : (evt.calculatedEndDate ?? start);
    const startD = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      const key = toLocalDateOnly(d);
      if (!map.has(key)) map.set(key, []);
      const list = map.get(key)!;
      if (!list.some(e => e.id === evt.id)) list.push(evt);
    }
  }
  return map;
}

/** Build a calendar grid (array of weeks) from a month Date. */
export function buildCalendarGrid(month: Date): (string | null)[][] {
  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDay = new Date(year, mon, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(mon + 1).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Build a human-readable label for a PlanApply with a success badge */
export function applyLabel(apply: import('../../shared/types').PlanApplyResponse): string {
  const shortId = apply.planId.slice(-6);
  const scope = apply.plantId
    ? 'Cây'
    : apply.farmZoneId
    ? 'Khu vực'
    : apply.farmPlotId
    ? 'Vườn'
    : 'Toàn bộ';
  const statusMap: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    APPLYING: 'Đang xử lý',
    ACTIVE: 'Đang áp dụng',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  const startLabel = apply.startDate ? ` · ${apply.startDate}` : '';
  const successLabel = apply.success === true ? ' ✓' : apply.success === false ? ' ✗' : '';
  return `Kế hoạch ...${shortId} · ${scope}${startLabel} · ${statusMap[apply.status] ?? apply.status}${successLabel}`;
}

/** Derive the initial month-bound date range from today's date. */
export function getInitialMonthBounds(): { startDate: string; endDate: string } {
  const todayDate = new Date();
  const y = todayDate.getFullYear();
  const m = todayDate.getMonth();
  return {
    startDate: toLocalDateOnly(new Date(y, m, 1)),
    endDate:   toLocalDateOnly(new Date(y, m + 1, 0)),
  };
}
