import { Info, Leaf } from 'lucide-react'
import { useTranslation } from '../../../i18n/useTranslation'

export function AboutCard() {
  const { t } = useTranslation();
  return (
    <div className="bg-[#f4f7f5] rounded-[24px] overflow-hidden flex flex-col border border-[#e2ebe5]">
      {/* Header & Content */}
      <div className="p-6 md:p-8 pb-4">
        <div className="flex items-center border-b border-[#245A34]/10 pb-4 mb-5">
          <Info className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-[#245A34]">{t("settings.about.title")}</h2>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start relative">
          {/* Main Text & Stats */}
          <div className="flex-1 space-y-5">
            <p className="text-[15px] font-semibold text-slate-700 leading-relaxed">
              <strong className="text-[#245A34] font-extrabold mr-1">Coffee Monitor</strong> 
              {t("settings.about.p1Start")}
            </p>
            <p className="text-[14px] font-semibold text-slate-600 leading-relaxed">
              {t("settings.about.p2")}
            </p>

            <div className="flex flex-wrap gap-4 pt-4 pb-2">
              <div className="bg-white rounded-full px-5 py-3.5 flex flex-col items-center justify-center min-w-[110px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                <span className="text-lg font-black text-[#245A34]">5000+</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t("settings.about.stats.farmers")}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3.5 flex flex-col items-center justify-center min-w-[110px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                <span className="text-lg font-black text-[#245A34]">150+</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t("settings.about.stats.experts")}</span>
              </div>
              <div className="bg-white rounded-full px-5 py-3.5 flex flex-col items-center justify-center min-w-[110px] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                <span className="text-lg font-black text-[#245A34]">24/7</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t("settings.about.stats.support")}</span>
              </div>
            </div>
          </div>

          {/* Graphic Placeholder (Right Side) */}
          <div className="w-56 h-56 shrink-0 flex items-center justify-center relative my-4 lg:my-0 lg:ml-8">
            <div className="absolute inset-0 bg-[#d9e8df] rounded-full scale-100"></div>
            <div className="absolute inset-4 bg-[#b3cfbe] rounded-full scale-100"></div>
            <div className="absolute inset-8 bg-[#8ab899] rounded-full scale-100 flex items-center justify-center shadow-inner blur-[1px]"></div>
            <div className="absolute inset-8 rounded-full flex items-center justify-center overflow-hidden z-10">
              <Leaf className="w-16 h-16 text-[#245a34] translate-y-1" fill="#245a34" strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-[#e4ede7] w-full py-3.5 px-6 md:px-8 text-center border-t border-[#d8e3db] mt-4">
        <p className="text-[13px] font-bold text-[#1a4226]">
          {t("settings.about.hotline")} <span className="font-extrabold">1800 - COFFEE</span>
        </p>
      </div>
    </div>
  )
}
