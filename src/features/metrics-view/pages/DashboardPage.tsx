import { Droplet, Thermometer, Wind, CheckCircle2, AlertTriangle, Plus, Minus, Target } from 'lucide-react'

// Mock Data
const AREAS = [
  {
    id: 'A',
    name: 'Khu A',
    status: 'Tốt',
    statusColor: 'text-[#245A34]',
    statusIcon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    borderColor: 'border-[#245A34]/20',
    bgColor: 'bg-[#F2FCF4]',
    dotColor: 'bg-[#245A34]',
    temp: '24°C',
    humidity: '65%',
    soil: '42%'
  },
  {
    id: 'B',
    name: 'Khu B',
    status: 'Cần tưới',
    statusColor: 'text-orange-600',
    statusIcon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
    borderColor: 'border-orange-300/40',
    bgColor: 'bg-[#FFFDF4]',
    dotColor: 'bg-orange-500',
    temp: '29°C',
    humidity: '45%',
    soil: '18%'
  },
  {
    id: 'C',
    name: 'Khu C',
    status: 'Tốt',
    statusColor: 'text-[#245A34]',
    statusIcon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    borderColor: 'border-[#245A34]/20',
    bgColor: 'bg-[#F2FCF4]',
    dotColor: 'bg-[#245A34]',
    temp: '23°C',
    humidity: '70%',
    soil: '55%'
  }
]

export function DashboardPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div>
        <h2 className="text-[28px] font-bold text-[#111827] tracking-tight">Bản đồ tổng quan vườn</h2>
        <p className="text-[#6B7280] text-[15px] font-medium mt-1">Chọn một khu vực trên bản đồ để xem chi tiết thông số loT.</p>
      </div>

      {/* Map Section */}
      <div className="relative w-full h-[380px] bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm flex items-center justify-center p-8"
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #E5E7EB 2px, transparent 0)', backgroundSize: '24px 24px' }}>
        
        {/* Search Bar */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 min-w-[280px]">
            <span className="text-sm font-semibold text-slate-400">Tìm kiếm khu vực...</span>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button className="p-3 text-slate-600 hover:bg-slate-50 transition-colors border-b border-slate-100"><Plus className="w-5 h-5" /></button>
            <button className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><Minus className="w-5 h-5" /></button>
          </div>
          <button className="p-3 bg-[#245A34] text-white rounded-full shadow-md hover:bg-[#1b432a] transition-colors">
            <Target className="w-5 h-5" />
          </button>
        </div>

        {/* Area Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-0">
          {AREAS.map((area) => (
            <div 
              key={area.id} 
              className={`relative flex flex-col justify-between h-[240px] ${area.bgColor} border-2 ${area.borderColor} rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
            >
              {/* Dot indicator */}
              <div className="absolute top-5 right-5 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${area.dotColor} opacity-20`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${area.dotColor}`}></span>
              </div>

              {/* Title Header */}
              <div>
                <span className={`text-[11px] font-bold tracking-widest uppercase ${area.name === 'Khu B' ? 'text-orange-500' : 'text-[#245A34]'}`}>KHU VỰC</span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{area.name}</h3>
              </div>
              
              {/* Stats Layout */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {/* Temp */}
                <div className="flex items-center text-slate-600">
                  <Thermometer className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{area.temp}</span>
                </div>
                {/* Humidity */}
                <div className="flex items-center text-slate-600">
                  <Wind className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{area.humidity}</span>
                </div>
                {/* Soil */}
                <div className="flex items-center text-slate-600">
                  <Droplet className="w-4 h-4 mr-2 text-slate-400" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-slate-700">{area.soil}</span>
                </div>
                {/* Status */}
                <div className={`flex items-center font-bold text-[13px] ${area.statusColor}`}>
                  {area.statusIcon}
                  <span>{area.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Metric 1 */}
        <div className="flex items-center p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EAF3EA] mr-4 shrink-0">
            <Thermometer className="w-6 h-6 text-[#245A34]" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">NHIỆT ĐỘ TB</p>
            <p className="text-2xl font-black text-slate-800 leading-none">25.3°C</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mr-4 shrink-0">
            <Droplet className="w-6 h-6 text-blue-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">ĐỘ ẨM ĐẤT TB</p>
            <p className="text-2xl font-black text-slate-800 leading-none">38.5%</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EAF3EA] mr-4 shrink-0">
            <div className="relative">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#245A34]">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">CẢM BIẾN ONLINE</p>
            <p className="text-2xl font-black text-slate-800 leading-none">12/12</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex items-center p-4 bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 mr-4 shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-500" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">CẢNH BÁO MỚI</p>
            <p className="text-2xl font-black text-slate-800 leading-none">01</p>
          </div>
        </div>

      </div>

    </div>
  )
}

export default DashboardPage
