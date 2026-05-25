import { useState } from 'react'
import { ModalShell } from '../../../components/ui/ModalShell'

interface EditDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (id: string, updates: { name: string; zone: string }) => void
  device: { id: string; name: string; zone?: string } | null
  zones: { id: string; name: string }[]
}

export function EditDeviceModal({ isOpen, onClose, onEdit, device, zones }: EditDeviceModalProps) {
  const [formData, setFormData] = useState(() => ({
    name: device?.name || '',
    zone: device?.zone || zones[0]?.id || ''
  }))

  if (!isOpen || !device) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEdit(device.id, formData)
    onClose()
  }

  return (
    <ModalShell
      onClose={onClose}
      title="Cập nhật Module"
      maxWidth="max-w-md"
    >
      <div className="p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">ID Thiết bị</label>
            <input
              disabled
              type="text"
              value={device.id}
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-slate-500 uppercase cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Tên Module</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Module cảm biến..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Khu vực phân bổ</label>
            <select
              required
              value={formData.zone}
              onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled className="text-slate-400">Chọn lô vườn...</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#245A34] text-white rounded-2xl font-bold hover:bg-green-800 transition-colors shadow-md text-[15px]"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  )
}
