import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from 'recharts'
import type { MetricData } from '../mockData'

interface IoTMetricCardProps {
  title: string
  icon: any
  data: MetricData
  colorClass: string
  barColor: string
  iconBgClass: string
}

export function IoTMetricCard({ title, icon: Icon, data, colorClass, barColor, iconBgClass }: IoTMetricCardProps) {
  const isNumberChange = typeof data.change === 'number'
  const isPositive = isNumberChange && (data.change as number) >= 0

  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col h-[240px] shadow-sm border border-slate-100/50 justify-between">
      
      {/* Top Row: Metric & Badge */}
      <div className="flex items-start justify-between w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full ${iconBgClass} shrink-0`}>
            <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-slate-500 mb-1 leading-none">{title}</h4>
            <div className="flex items-baseline">
              <span className="text-[22px] font-black text-slate-800 leading-none">{data.value}</span>
              {data.unit !== 'Lux' && <span className="text-[22px] font-black text-slate-800 leading-none">{data.unit}</span>}
              {data.unit === 'Lux' && <span className="text-[14px] font-bold text-slate-800 leading-none ml-1">{data.unit}</span>}
            </div>
          </div>
        </div>

        <div className={`flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0 ${
          isNumberChange
            ? isPositive ? 'bg-green-50 text-[#10B981]' : 'bg-red-50 text-[#EF4444]'
            : 'bg-slate-50 text-slate-500' // 'Ổn định' badge styling
        }`}>
          {isNumberChange ? (isPositive ? '+' : '') : ''}{data.change}{isNumberChange ? '%' : ''}
        </div>
      </div>

      {/* Bottom: Bar Chart */}
      <div className="flex-1 mt-6 w-full relative">
        <div className={`absolute inset-x-0 bottom-0 h-14 ${iconBgClass} rounded-t-none rounded-b-[1.25rem]`} />
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.trend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
              dy={10}
            />
            <YAxis hide domain={['dataMin', 'dataMax + 2']} />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'white', padding: '8px 12px' }}
              itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}
              labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '2px', textTransform: 'uppercase' }}
              formatter={(value: any) => [`${value} ${data.unit}`, title]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {data.trend.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={barColor} 
                  fillOpacity={index === data.trend.length - 1 ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
