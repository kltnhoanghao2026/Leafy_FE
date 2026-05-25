import { Leaf, Radar, ShieldCheck } from 'lucide-react'

export function LoginHero () {
  return (
    <div className="relative flex flex-col justify-end w-full lg:w-[480px] h-[320px] lg:h-auto overflow-hidden bg-[#245A34] p-8 lg:p-10 text-white shrink-0">
      <img
        src="/images/coffee-garden.jpg"
        alt="Vườn cà phê xanh"
        className="absolute inset-0 object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#12301f] via-[#12301f]/75 to-[#12301f]/20" />

      <div className="relative z-10 flex flex-col justify-end h-full mt-auto">
        <div className="flex items-center gap-4 mb-4 lg:mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm">
            <Leaf className="w-6 h-6 text-white text-opacity-90" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Leafy</h1>
          </div>
        </div>

        <p className="mb-6 lg:mb-10 text-base lg:text-[1.05rem] font-semibold leading-relaxed text-green-50/95 max-w-sm">
          Theo dõi vườn cà phê, thiết bị IoT và cảnh báo canh tác trong một nơi.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 rounded-2xl bg-white/12 p-3 backdrop-blur-sm ring-1 ring-white/15">
            <Radar className="mt-0.5 h-5 w-5 shrink-0 text-green-100" />
            <div>
              <div className="text-sm font-bold text-white">Dữ liệu theo thời gian</div>
              <div className="mt-0.5 text-xs font-medium leading-relaxed text-green-50/85">
                Xem cảm biến, camera và cảnh báo mới nhất của từng khu vực.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-white/12 p-3 backdrop-blur-sm ring-1 ring-white/15">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-100" />
            <div>
              <div className="text-sm font-bold text-white">Quản lý chủ động</div>
              <div className="mt-0.5 text-xs font-medium leading-relaxed text-green-50/85">
                Nắm nhanh tình trạng vườn, khu vực và thiết bị đang vận hành.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
