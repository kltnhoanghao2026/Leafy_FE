import { useState } from 'react'
import { ModalShell } from '../../../components/ui/ModalShell'

interface AddZoneModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (zone: { name: string; variety: string; area: string; status: 'ĐANG TRỒNG' | 'ĐANG CẢI TẠO' }) => void
}

export function AddZoneModal({ isOpen, onClose, onAdd }: AddZoneModalProps) {
  const [formData, setFormData] = useState<{
    name: string
    variety: string
    area: string
    status: 'ĐANG TRỒNG' | 'ĐANG CẢI TẠO'
  }>({ 
    name: '', 
    variety: '', 
    area: '',
    status: 'ĐANG TRỒNG'
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    setFormData({ name: '', variety: '', area: '', status: 'ĐANG TRỒNG' }) // Reset
    onClose()
  }

  return (
    <ModalShell
      onClose={onClose}
      title="Thêm Lô vườn mới"
      maxWidth="max-w-md"
    >
      <div className="p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Tên Lô (VD: Khu D)</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên lô..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Giống cây trồng</label>
            <input
              required
              type="text"
              value={formData.variety}
              onChange={(e) => setFormData(prev => ({ ...prev, variety: e.target.value }))}
              placeholder="VD: Arabica..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Diện tích (ha)</label>
            <input
              required
              type="text"
              value={formData.area}
              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
              placeholder="0.0 ha"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Trạng thái</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ĐANG TRỒNG' | 'ĐANG CẢI TẠO' }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-[15px] font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#245A34]/20 focus:border-[#245A34] transition-all appearance-none cursor-pointer"
            >
              <option value="ĐANG TRỒNG">ĐANG TRỒNG</option>
              <option value="ĐANG CẢI TẠO">ĐANG CẢI TẠO</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#245A34] text-white rounded-2xl font-bold hover:bg-green-800 transition-colors shadow-md text-[15px]"
            >
              Thêm lô vườn
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  )
}
