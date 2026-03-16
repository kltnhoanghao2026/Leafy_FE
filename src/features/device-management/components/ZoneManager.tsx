import { useState } from 'react'
import { Map, Edit2, Check, X, Trash2, LayoutGrid, PlusCircle } from 'lucide-react'
import type { Zone } from '../mockDevices'
import { AddZoneModal } from './AddZoneModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { useManagementStore } from '../../../store/useManagementStore'
import { toast } from 'react-hot-toast'

export function ZoneManager() {
  const zones = useManagementStore(state => state.zones)
  const addZone = useManagementStore(state => state.addZone)
  const updateZone = useManagementStore(state => state.updateZone)
  const deleteZone = useManagementStore(state => state.deleteZone)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Quick local copies for editing without touching global store
  const [editForm, setEditForm] = useState<Partial<Zone>>({})

  const handleEditClick = (zone: Zone) => {
    setEditingId(zone.id)
    setEditForm({ variety: zone.variety, area: zone.area })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleSaveEdit = (id: string) => {
    updateZone(id, editForm)
    setEditingId(null)
    toast.success("Cập nhật lô vườn thành công!")
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-[#245A34]" strokeWidth={2.5} />
          <h3 className="text-[18px] lg:text-[20px] font-bold text-[#245A34] tracking-tight">
            Quản lý Khu vực
          </h3>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="text-[14px] font-bold text-[#245A34] hover:underline flex items-center gap-1.5"
        >
          <PlusCircle className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
          Thêm khu vực mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const isEditing = editingId === zone.id

          return (
            <div key={zone.id} className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50 hover:border-[#245A34]/20 transition-colors group">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
                    <Map className="w-6 h-6 text-[#245A34]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-[18px] font-bold text-gray-900 leading-none mb-1.5">{zone.name}</h4>
                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-full ${
                      zone.status === 'ĐANG TRỒNG' 
                        ? 'bg-green-50 text-[#10B981]' 
                        : 'bg-orange-50 text-[#F59E0B]'
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSaveEdit(zone.id)} className="w-8 h-8 rounded-full bg-green-50 text-[#10B981] flex items-center justify-center hover:bg-[#10B981] hover:text-white transition-colors">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <button onClick={handleCancelEdit} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <X className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDeletingId(zone.id)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm">
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="py-2 border-b border-slate-100 min-h-[44px] flex items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-[13px] font-semibold text-slate-500 shrink-0">Giống:</span>
                      <input 
                        type="text" 
                        value={editForm.variety} 
                        onChange={(e) => setEditForm({ ...editForm, variety: e.target.value })}
                        className="w-full bg-slate-50 rounded px-2 py-1 text-[14px] font-medium text-slate-500 outline-none focus:ring-1 focus:ring-[#245A34]"
                      />
                    </div>
                  ) : (
                    <span className="text-[14px] font-medium text-slate-500">Giống: {zone.variety}</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-1/2">
                      <input 
                        type="text" 
                        value={editForm.area} 
                        onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                        className="w-full bg-slate-50 rounded px-2 py-1 text-[13px] font-bold text-slate-400 outline-none focus:ring-1 focus:ring-[#245A34]"
                      />
                    </div>
                  ) : (
                    <span className="text-[14px] font-bold text-slate-400">{zone.area}</span>
                  )}
                  
                  <button 
                    onClick={() => handleEditClick(zone)}
                    className="px-4 py-1.5 rounded-full border border-slate-200 text-[#245A34] font-bold text-[13px] flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Sửa
                  </button>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      <AddZoneModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newZone) => {
          const id = String.fromCharCode(65 + zones.length) // D, E, etc.
          addZone({ id, ...newZone })
          toast.success("Thêm lô vườn thành công!")
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Xóa lô vườn"
        message="Bạn có chắc chắn muốn xóa phân lô này? Toàn bộ dữ liệu thiết bị liên kết có thể bị ảnh hưởng."
        onConfirm={() => {
          if (deletingId) {
            deleteZone(deletingId)
            toast.success("Đã xóa lô vườn")
          }
        }}
      />
    </div>
  )
}
