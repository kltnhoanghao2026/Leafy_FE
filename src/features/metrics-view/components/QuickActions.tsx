import { BriefcaseMedical, MessageSquare, PlusSquare } from 'lucide-react'
import { useTranslation } from '../../../i18n'

export function QuickActions() {
  const { t } = useTranslation()

  return (
    <div className="mt-8">
      <div className="flex items-center mb-6">
        <svg className="w-5 h-5 text-[#245A34] mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">{t("iot.dashboard.quickActions")}</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <button className="flex flex-col items-center justify-center py-6 px-6 bg-[#245A34] text-white rounded-[2rem] hover:bg-[#1b432a] transition-all shadow-md group">
          <BriefcaseMedical className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          <span className="text-[15px] font-bold">{t("iot.dashboard.viewDisease")}</span>
        </button>

        <button className="flex flex-col items-center justify-center py-6 px-6 bg-white text-[#245A34] border-2 border-[#245A34] rounded-[2rem] hover:bg-green-50 transition-all font-bold group">
          <MessageSquare className="w-6 h-6 mb-2 group-hover:text-[#1b432a] transition-transform" strokeWidth={2.5} />
          <span className="text-[15px]">{t("iot.dashboard.messageExpert")}</span>
        </button>

        <button className="flex flex-col items-center justify-center py-6 px-6 bg-white text-slate-600 border border-slate-200 shadow-sm rounded-[2rem] hover:shadow-md hover:border-slate-300 transition-all font-bold group">
          <PlusSquare className="w-6 h-6 mb-2 text-slate-500 group-hover:text-slate-700 transition-transform" strokeWidth={2.5} />
          <span className="text-[15px]">{t("iot.dashboard.askPost")}</span>
        </button>
      </div>
    </div>
  )
}
