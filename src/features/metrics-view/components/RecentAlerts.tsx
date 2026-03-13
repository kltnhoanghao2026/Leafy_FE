import { Info, Bug } from 'lucide-react'

// Mock Data for Alerts
const ALERTS = [
  {
    id: 1,
    title: 'Rệp sáp xuất hiện',
    desc: 'Phát hiện tại Khu A - Lô 12',
    time: '2 GIỜ TRƯỚC',
    icon: <Bug className="w-5 h-5 text-[#EF4444] shrink-0" strokeWidth={2.5} />,
    bgColor: 'bg-[#FEF2F2]',
    borderColor: 'border-red-100',
    titleColor: 'text-[#EF4444]',
    timeColor: 'text-red-400'
  },
  {
    id: 2,
    title: 'Độ ẩm đất thấp',
    desc: 'Cần tưới nước cho Khu B',
    time: '5 GIỜ TRƯỚC',
    icon: <svg className="w-5 h-5 text-[#F59E0B] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l6 14H4L10 2z"/></svg>,
    bgColor: 'bg-[#FFFBEB]',
    borderColor: 'border-yellow-100',
    titleColor: 'text-[#F59E0B]',
    timeColor: 'text-yellow-400'
  },
  {
    id: 3,
    title: 'Lịch bón phân',
    desc: 'Đã đến hạn bón đợt 2',
    time: 'HÔM QUA',
    icon: <Info className="w-5 h-5 text-[#3B82F6] shrink-0" strokeWidth={2.5} />,
    bgColor: 'bg-[#EFF6FF]',
    borderColor: 'border-blue-100',
    titleColor: 'text-[#3B82F6]',
    timeColor: 'text-blue-400'
  }
]

export function RecentAlerts() {
  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50 mb-6 lg:mb-8">
      <div className="flex items-start justify-between mb-8">
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight leading-sm max-w-[120px]">Cảnh báo gần đây</h3>
        <button className="px-3 py-1.5 bg-[#ECFDF5] text-[13px] font-bold text-[#245A34] rounded-full hover:bg-green-100 transition-colors">Xem tất cả</button>
      </div>
      
      <div className="space-y-4">
        {ALERTS.map((alert) => (
          <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-3xl ${alert.bgColor} border ${alert.borderColor}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0`}>
              {alert.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-[15px] font-bold ${alert.titleColor} truncate leading-tight`}>{alert.title}</h4>
              <p className="text-[12px] font-semibold text-slate-500 mt-0.5">{alert.desc}</p>
              <p className={`text-[10px] font-black tracking-wider uppercase mt-1 ${alert.timeColor}`}>{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
