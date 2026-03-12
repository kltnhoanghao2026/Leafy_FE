import { Coffee } from 'lucide-react'

export function LoginHero () {
  return (
    <div className="relative flex flex-col justify-end w-full lg:w-[480px] h-[280px] lg:h-auto overflow-hidden bg-[#245A34] p-8 lg:p-10 text-white shrink-0">
      {/* Background Image Placeholder */}
      <img
        src="/images/coffee-bg.jpg"
        alt="Coffee Cherries"
        className="absolute inset-0 object-cover w-full h-full mix-blend-overlay opacity-60"
        aria-hidden="true"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b432a] via-[#1b432a]/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full mt-auto">
        <div className="flex items-center gap-4 mb-4 lg:mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
            <Coffee className="w-6 h-6 text-white text-opacity-90" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Coffee Monitor</h1>
            <p className="text-sm font-medium text-green-100/90 text-shadow-sm">Hệ thống giám sát</p>
          </div>
        </div>

        <blockquote className="mb-6 lg:mb-10 text-base lg:text-[1.1rem] font-medium leading-relaxed italic text-green-50/95 max-w-sm">
          "Nâng cao giá trị nông sản Việt"
        </blockquote>

        <div className="flex items-center gap-8 pt-2">
          <div>
            <div className="text-3xl font-bold text-white drop-shadow-sm">1.2k+</div>
            <div className="mt-1 text-xs font-semibold tracking-wider text-green-200/80 uppercase">
              Nông hộ tin dùng
            </div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div>
            <div className="text-3xl font-bold text-white drop-shadow-sm">98%</div>
            <div className="mt-1 text-xs font-semibold tracking-wider text-green-200/80 uppercase">
              Độ chính xác
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
