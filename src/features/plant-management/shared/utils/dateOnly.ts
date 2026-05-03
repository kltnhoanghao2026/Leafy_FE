const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const toLocalDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDateOnly = (value: string) => {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

export const isValidDateOnly = (value?: string | null) =>
  Boolean(value && parseLocalDateOnly(value));

export const addLocalDays = (value: string | Date, days: number) => {
  const base =
    typeof value === "string" ? parseLocalDateOnly(value) : new Date(value);

  if (!base || Number.isNaN(base.getTime())) {
    return typeof value === "string" ? value : toLocalDateOnly(new Date());
  }

  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return toLocalDateOnly(next);
};

export const daysBetweenDateOnly = (startDate: string, targetDate: string) => {
  const start = parseLocalDateOnly(startDate);
  const target = parseLocalDateOnly(targetDate);

  if (!start || !target) return 0;

  const startNoon = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    12,
  );
  const targetNoon = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
    12,
  );

  return Math.max(
    0,
    Math.round((targetNoon.getTime() - startNoon.getTime()) / 86_400_000),
  );
};

export const compareDateOnly = (left: string, right: string) => {
  const leftDate = parseLocalDateOnly(left);
  const rightDate = parseLocalDateOnly(right);

  if (!leftDate || !rightDate) return 0;

  return (
    new Date(
      leftDate.getFullYear(),
      leftDate.getMonth(),
      leftDate.getDate(),
      12,
    ).getTime() -
    new Date(
      rightDate.getFullYear(),
      rightDate.getMonth(),
      rightDate.getDate(),
      12,
    ).getTime()
  );
};

export const startOfLocalWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
};

export const getTodayDateOnly = () => toLocalDateOnly(new Date());
