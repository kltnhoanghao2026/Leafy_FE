import { BriefcaseMedical, MessageSquare, PlusSquare } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="mt-8">
      <div className="flex items-center mb-6">
        <svg className="w-5 h-5 text-[#245A34] mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Thao tác nhanh</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Action 1: Xem bệnh (Primary) */}
        <button className="flex flex-col items-center justify-center py-6 px-6 bg-[#245A34] text-white rounded-[2rem] hover:bg-[#1b432a] transition-all shadow-md group">
          <BriefcaseMedical className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          <span className="text-[15px] font-bold">Xem bệnh</span>
        </button>

        {/* Action 2: Nhắn chuyên gia (Outlined) */}
        <button className="flex flex-col items-center justify-center py-6 px-6 bg-white text-[#245A34] border-2 border-[#245A34] rounded-[2rem] hover:bg-green-50 transition-all font-bold group">
          <MessageSquare className="w-6 h-6 mb-2 group-hover:text-[#1b432a] transition-transform" strokeWidth={2.5} />
          <span className="text-[15px]">Nhắn chuyên gia</span>
        </button>

        {/* Action 3: Đăng bài hỏi (Shadow Card) */}
        <button className="flex flex-col items-center justify-center py-6 px-6 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-[2rem] hover:shadow-md hover:border-slate-300 transition-all font-bold group">
          <PlusSquare className="w-6 h-6 mb-2 text-slate-500 group-hover:text-slate-700 transition-transform" strokeWidth={2.5} />
          <span className="text-[15px]">Đăng bài hỏi</span>
        </button>
      </div>
    </div>
  )
}
