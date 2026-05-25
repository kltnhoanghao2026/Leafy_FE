import { useSettingsStore } from "../../settings/store/useSettingsStore";
import type { Locale } from "../../../i18n";

const parseDateTimeValue = (value?: string | number | null): Date | null => {
  if (!value) return null;

  if (typeof value === "number") {
    const millis = Math.abs(value) < 10_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const localeToIntl = (locale: Locale) => (locale === "vi" ? "vi-VN" : "en-US");

const currentIntlLocale = () => localeToIntl(useSettingsStore.getState().locale);

export const formatDateTime = (value?: string | number | null): string => {
  if (!value) return useSettingsStore.getState().locale === "vi" ? "Chưa bao giờ" : "Never";

  const date = parseDateTimeValue(value);
  if (!date) return String(value);

  return new Intl.DateTimeFormat(currentIntlLocale(), {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatNumber = (value?: number | null): string => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat(currentIntlLocale()).format(value);
};

export const formatSensorValue = (
  value?: number | null,
  unit?: string | null,
): string => {
  if (value === null || value === undefined) return "-";
  const normalizedUnit = unit === "C" ? "deg C" : unit || "";
  return `${new Intl.NumberFormat(currentIntlLocale(), {
    maximumFractionDigits: 1,
  }).format(value)}${normalizedUnit ? ` ${normalizedUnit}` : ""}`;
};

export const compactId = (value?: string | null): string => {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};
