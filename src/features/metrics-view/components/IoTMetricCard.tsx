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
  timestamp: string;
  label: string;
  value: number;
  minValue?: number | null;
  maxValue?: number | null;
  sampleCount?: number | null;
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
  const chartHeight = 112;

  return (
    <div className="bg-white rounded-3xl p-6 flex min-w-0 flex-col h-[260px] shadow-sm border border-slate-100/50 justify-between">
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

      <div className="mt-2 h-28 min-h-28 w-full min-w-0 relative">
        <div
          className={`absolute inset-x-0 bottom-0 h-14 ${iconBgClass} rounded-t-none rounded-b-[1.25rem]`}
        />
        {chartPointCount > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight} minWidth={0}>
            <BarChart
              data={data.trend}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="18%"
            >
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
                tickFormatter={(_, index) => data.trend[index]?.label ?? ""}
                interval="preserveStartEnd"
                dy={10}
              />
              <YAxis hide domain={["dataMin", "dataMax"]} />
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
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as SensorTrend | undefined;
                  return point?.label ?? "";
                }}
                formatter={(value, _name, props) => {
                  const point = props.payload as SensorTrend | undefined;
                  const formattedValue =
                    typeof value === "number"
                      ? new Intl.NumberFormat("en", {
                          maximumFractionDigits: 2,
                        }).format(value)
                      : String(value);
                  const sampleSuffix = point?.sampleCount
                    ? ` (${point.sampleCount} samples)`
                    : "";
                  return [`${formattedValue} ${data.unit}${sampleSuffix}`, title];
                }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              >
                {data.trend.map((point, index) => (
                  <Cell
                    key={`${point.timestamp}-${index}`}
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
