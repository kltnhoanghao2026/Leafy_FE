export const formatDateTime = (value?: string | null): string => {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatNumber = (value?: number | null): string => {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en").format(value);
};

export const formatSensorValue = (
  value?: number | null,
  unit?: string | null,
): string => {
  if (value === null || value === undefined) return "-";
  const normalizedUnit = unit === "C" ? "deg C" : unit || "";
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value)}${normalizedUnit ? ` ${normalizedUnit}` : ""}`;
};

export const compactId = (value?: string | null): string => {
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};
