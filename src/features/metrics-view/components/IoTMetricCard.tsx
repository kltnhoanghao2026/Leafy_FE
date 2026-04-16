import type { ComponentType } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SensorTrend {
  time: string;
  value: number;
}

export interface MetricData {
  value: number | string;
  unit: string;
  trend: SensorTrend[];
  badge?: string;
}

interface IoTMetricCardProps {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  data: MetricData;
  colorClass: string;
  barColor: string;
  iconBgClass: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function IoTMetricCard({
  title,
  icon: Icon,
  data,
  colorClass,
  barColor,
  iconBgClass,
  isLoading = false,
  isError = false,
}: IoTMetricCardProps) {
  const chartPointCount = data.trend.length;

  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col h-[240px] shadow-sm border border-slate-100/50 justify-between">
      <div className="flex items-start justify-between w-full shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBgClass} shrink-0`}
          >
            <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-slate-500 mb-1 leading-none">
              {title}
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black text-slate-800 leading-none">
                {isLoading && data.value === "-" ? "..." : data.value}
              </span>
              <span
                className={`font-black text-slate-800 leading-none ${
                  data.unit === "Lux" ? "text-[14px]" : "text-[22px]"
                }`}
              >
                {data.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0 bg-slate-50 text-slate-500">
          {isError ? "Error" : data.badge || "Live"}
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {chartPointCount} chart points
      </p>

      <div className="flex-1 mt-2 w-full relative">
        <div
          className={`absolute inset-x-0 bottom-0 h-14 ${iconBgClass} rounded-t-none rounded-b-[1.25rem]`}
        />
        {chartPointCount > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.trend}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                dy={10}
              />
              <YAxis hide domain={["dataMin", "dataMax + 2"]} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  background: "white",
                  padding: "8px 12px",
                }}
                itemStyle={{
                  color: "#0f172a",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
                labelStyle={{
                  color: "#64748b",
                  fontSize: "11px",
                  marginBottom: "2px",
                  textTransform: "uppercase",
                }}
                formatter={(value) => [`${value} ${data.unit}`, title]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {data.trend.map((point, index) => (
                  <Cell
                    key={`${point.time}-${index}`}
                    fill={barColor}
                    fillOpacity={index === data.trend.length - 1 ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="relative h-full flex items-center justify-center text-sm font-bold text-slate-400">
            {isLoading ? "Loading chart" : "No chart data"}
          </div>
        )}
      </div>
    </div>
  );
}
