import { Eye, Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

export function DisplaySettingsCard() {
  const { theme, setTheme } = useSettingsStore()

  return (
    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <Eye className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">Cài đặt hiển thị</h2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100/60 bg-slate-50/30 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-gradient-to-r from-transparent from-50% to-amber-500 to-50%"></div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Chế độ giao diện</h3>
            <p className="text-[13px] font-semibold text-slate-500 mt-0.5">Chọn giữa giao diện Sáng hoặc Tối để bảo vệ mắt.</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-200/60 shrink-0">
          <button 
            onClick={() => setTheme('light')}
            className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              theme === 'light' 
                ? 'bg-[#245A34] text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Sáng
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex items-center px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              theme === 'dark' 
                ? 'bg-[#245A34] text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Tối
          </button>
        </div>
      </div>
    </div>
  )
}
