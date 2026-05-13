interface CSVChartPoint {
  timestamp: string | number;
  value: number;
  status?: string | null;
  rollingAverage?: number | null;
  trendValue?: number | null;
  movingMin?: number | null;
  movingMax?: number | null;
  alertSeverity?: string | null;
  alertMessage?: string | null;
}

interface CSVExportButtonProps {
  chartData: CSVChartPoint[];
  filename: string;
  status?: string | null;
  className?: string;
}

const escapeCsvValue = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export function CSVExportButton({
  chartData,
  filename,
  status,
  className,
}: CSVExportButtonProps) {
  const handleExport = () => {
    const rows = [
      [
        "timestamp",
        "value",
        "status",
        "rollingAverage",
        "trendValue",
        "movingMin",
        "movingMax",
        "alertSeverity",
        "alertMessage",
      ],
      ...chartData.map((point) => [
        point.timestamp,
        point.value,
        point.status || status || "",
        point.rollingAverage ?? "",
        point.trendValue ?? "",
        point.movingMin ?? "",
        point.movingMax ?? "",
        point.alertSeverity ?? "",
        point.alertMessage ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      aria-label={`Export ${filename} as CSV`}
      onClick={handleExport}
      disabled={chartData.length === 0}
      className={
        className ||
        "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 hover:border-[#245A34] hover:text-[#245A34] disabled:cursor-not-allowed disabled:opacity-40"
      }
    >
      CSV
    </button>
  );
}
