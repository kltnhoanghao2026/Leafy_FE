import { ShieldCheck } from 'lucide-react'
import type { OnlineExpert } from '../types'
import { MOCK_EXPERTS } from '../mockCommunityData'

export function OnlineExpertsWidget() {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/50">
      
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
        <h3 className="text-[17px] font-bold text-gray-900 tracking-tight">Chuyên gia trực tuyến</h3>
      </div>

      <div className="space-y-5 mb-6">
        {MOCK_EXPERTS.map((expert: OnlineExpert) => (
          <div key={expert.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={expert.avatar} 
                  alt={expert.name} 
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                {expert.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-gray-900 group-hover:text-[#245A34] transition-colors cursor-pointer">
                  {expert.name}
                </span>
                <span className="text-[12px] font-medium text-slate-500">
                  {expert.specialty}
                </span>
              </div>
            </div>
            
            <button className="text-[11px] font-black text-[#245A34] uppercase tracking-wider hover:opacity-75 transition-opacity px-2">
              NHẮN TIN
            </button>
          </div>
        ))}
      </div>

      <button className="w-full py-2.5 rounded-full border border-slate-200 text-[14px] font-bold text-[#245A34] hover:bg-slate-50 transition-colors">
        Xem tất cả chuyên gia
      </button>

    </div>
  )
}
