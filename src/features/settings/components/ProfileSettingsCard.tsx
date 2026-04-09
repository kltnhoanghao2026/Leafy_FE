import { useEffect, useState, useCallback } from 'react'
import { User, Camera, Loader2, AlertCircle } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { ROLE_LABELS } from '../types'
import toast from 'react-hot-toast'

export function ProfileSettingsCard () {
  const { profile, isLoading, isSaving, hasError, fetchProfile, updateProfile } = useSettingsStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Sync local form state when profile is loaded/updated
  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName || '')
    setEmail(profile.email || '')
    setPhone(profile.phoneNumber || '')
    setBio(profile.bio || '')
  }, [profile])

  const roleDisplay = profile?.role
    ? ROLE_LABELS[profile.role] || profile.role
    : ''

  const avatarSrc = profile?.avatar || profile?.profilePicture || 'https://i.pravatar.cc/150?img=11'

  const handleSave = useCallback(async () => {
    try {
      await updateProfile({ bio })
      toast.success('Đã lưu thay đổi thành công!')
    } catch {
      toast.error('Lưu thay đổi thất bại. Vui lòng thử lại.')
    }
  }, [bio, updateProfile])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
            <h2 className="text-lg font-bold text-slate-800">Thông tin cá nhân</h2>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#245A34] animate-spin" />
          <span className="ml-3 text-sm font-semibold text-slate-500">Đang tải thông tin...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError && !profile) {
    return (
      <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
            <h2 className="text-lg font-bold text-slate-800">Thông tin cá nhân</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold text-slate-500">{hasError}</p>
          <button
            onClick={fetchProfile}
            className="text-sm font-bold text-[#245A34] hover:underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center">
          <User className="w-5 h-5 text-[#245A34] mr-2" strokeWidth={2.5} />
          <h2 className="text-lg font-bold text-slate-800">Thông tin cá nhân</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#245A34] hover:bg-[#1a4226] disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Lưu thay đổi
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-start shrink-0">
          <div className="relative">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 shadow-sm"
            />
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-700" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Form Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 w-full">
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              readOnly
              className="bg-slate-100/50 border border-slate-100/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed w-full"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700">Vai trò</label>
            <input
              type="text"
              value={roleDisplay}
              readOnly
              className="bg-slate-100/50 border border-slate-100/50 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 focus:outline-none cursor-not-allowed w-full"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="bg-slate-100/50 border border-slate-100/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed w-full"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              readOnly
              className="bg-slate-100/50 border border-slate-100/50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
