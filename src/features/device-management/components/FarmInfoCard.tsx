import { useState, useEffect } from 'react'
import { Info, Check, X } from 'lucide-react'
import { useManagementStore } from '../../../store/useManagementStore'
import { toast } from 'react-hot-toast'

export function FarmInfoCard() {
  const farmInfo = useManagementStore(state => state.farmInfo)
  const updateFarmInfo = useManagementStore(state => state.updateFarmInfo)

  const [formData, setFormData] = useState(farmInfo)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Keep local form in sync if global state changes
  useEffect(() => {
    setFormData(farmInfo)
  }, [farmInfo])

  const handleSave = () => {
    setIsLoading(true)
    const toastId = toast.loading('Đang xử lý...')
    
    // Simulate API delay
    setTimeout(() => {
      updateFarmInfo(formData)
      setIsLoading(false)
      setIsEditing(false)
      toast.success('Cập nhật thành công!', { id: toastId })
    }, 800)
  }

  const handleCancel = () => {
    setFormData(farmInfo)
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
          </div>
          <h3 className="text-[18px] lg:text-[20px] font-bold text-[#245A34] tracking-tight">
            Thông tin vườn ươm
          </h3>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 bg-[#245A34] text-white text-[14px] font-bold rounded-full hover:bg-green-800 transition-colors flex items-center disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" strokeWidth={2.5} />
                )}
                Lưu
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-[#ECFDF5] text-[#245A34] text-[14px] font-bold rounded-full hover:bg-green-100 transition-colors"
            >
              Cập nhật thông tin
            </button>
          )}
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Name Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1 mb-1">Tên nông trại</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            readOnly={!isEditing}
            className={`w-full rounded-full px-5 py-3.5 text-[15px] font-medium text-gray-900 outline-none transition-all ${
              isEditing ? 'bg-white border-2 border-[#245A34]/30 focus:border-[#245A34]' : 'bg-slate-50 border border-slate-100'
            }`}
            placeholder="Nhập tên..."
          />
        </div>

        {/* Location Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1 mb-1">Vị trí (Tỉnh/Thành)</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            readOnly={!isEditing}
            className={`w-full rounded-full px-5 py-3.5 text-[15px] font-medium text-gray-900 outline-none transition-all ${
              isEditing ? 'bg-white border-2 border-[#245A34]/30 focus:border-[#245A34]' : 'bg-slate-50 border border-slate-100'
            }`}
            placeholder="Nhập vị trí..."
          />
        </div>

        {/* Area Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1 mb-1">Tổng diện tích (ha)</label>
          <input
            type="text"
            value={formData.area}
            onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
            readOnly={!isEditing}
            className={`w-full rounded-full px-5 py-3.5 text-[15px] font-medium text-gray-900 outline-none transition-all ${
              isEditing ? 'bg-white border-2 border-[#245A34]/30 focus:border-[#245A34]' : 'bg-slate-50 border border-slate-100'
            }`}
            placeholder="0.0 ha"
          />
        </div>

      </div>

    </div>
  )
}
