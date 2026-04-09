import { ProfileSettingsCard } from '../components/ProfileSettingsCard'
import { DisplaySettingsCard } from '../components/DisplaySettingsCard'
import { AboutCard } from '../components/AboutCard'

export function SettingsView() {
  return (
    <div className="max-w-4xl mx-auto w-full pb-10 pt-2">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1.5">
          Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn.
        </p>
      </div>
      
      <div className="space-y-6">
        <ProfileSettingsCard />
        <DisplaySettingsCard />
        <AboutCard />
      </div>

      <div className="mt-12 text-center pb-4">
        <p className="text-[13px] font-bold text-slate-400">
          © 2024 Coffee Monitor Việt Nam. Bảo lưu mọi quyền.
        </p>
      </div>
    </div>
  )
}
