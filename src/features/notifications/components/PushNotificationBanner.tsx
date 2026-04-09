import { Bell, BellOff, RefreshCcw, ShieldAlert, X } from 'lucide-react'

interface PushNotificationBannerProps {
  mode: 'enable' | 'blocked' | 'error' | 'unconfigured'
  isBusy: boolean
  errorMessage?: string | null
  onEnable: () => void
  onRetry: () => void
  onDismiss: () => void
}

export function PushNotificationBanner({
  mode,
  isBusy,
  errorMessage,
  onEnable,
  onRetry,
  onDismiss
}: PushNotificationBannerProps) {
  if (mode === 'blocked') {
    return (
      <div className="max-w-7xl mx-auto rounded-[1.75rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Thông báo đang bị chặn</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Trình duyệt chưa cho phép nhận cảnh báo</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">
                Hãy bật lại quyền thông báo trong cài đặt trình duyệt để nhận cảnh báo độ ẩm, nhiệt độ và bệnh cây theo thời gian thực.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-amber-200 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <X className="h-4 w-4" strokeWidth={2.6} />
            Ẩn nhắc nhở
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'error') {
    return (
      <div className="max-w-7xl mx-auto rounded-[1.75rem] border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <BellOff className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-700">Đăng ký push chưa hoàn tất</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Thiết bị chưa đồng bộ được push token</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">
                {errorMessage || 'Token đã được cấp quyền nhưng chưa gửi thành công lên backend. Bạn có thể thử đồng bộ lại.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <X className="h-4 w-4" strokeWidth={2.6} />
              Để sau
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCcw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} strokeWidth={2.6} />
              Đồng bộ lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'unconfigured') {
    return (
      <div className="max-w-7xl mx-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <BellOff className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Firebase chưa cấu hình</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Thiếu biến môi trường cho web push</h3>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Cần cấu hình Firebase Messaging và VAPID key trước khi web có thể tạo push token.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto rounded-[1.75rem] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(219,252,231,0.95),_rgba(255,255,255,1)_58%)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#245A34]">
            <Bell className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#245A34]">Bật thông báo cho thiết bị này</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Nhận cảnh báo độ ẩm, nhiệt độ và bệnh cây theo thời gian thực</h3>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Khi bạn cho phép, hệ thống sẽ lấy FCM token trên trình duyệt hiện tại và gắn nó với tài khoản đang đăng nhập.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-[#245A34] transition-colors hover:bg-emerald-50"
          >
            <X className="h-4 w-4" strokeWidth={2.6} />
            Để sau
          </button>
          <button
            type="button"
            onClick={onEnable}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#245A34] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Bell className="h-4 w-4" strokeWidth={2.6} />
            {isBusy ? 'Đang bật...' : 'Bật thông báo'}
          </button>
        </div>
      </div>
    </div>
  )
}
