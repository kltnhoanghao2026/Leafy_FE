import { useState } from 'react'
import { Trash2, Plus, Radio, Share2, SlidersHorizontal } from 'lucide-react'
import type { Sensor } from '../mockDevices'
import { AddDeviceModal } from './AddDeviceModal'
import { EditDeviceModal } from './EditDeviceModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { useManagementStore } from '../../../store/useManagementStore'
import { toast } from 'react-hot-toast'

function BatteryBar({ percentage }: { percentage: number }) {
  let colorClass = 'bg-[#10B981]' // Green default
  if (percentage <= 20) colorClass = 'bg-slate-300'
  else if (percentage <= 50) colorClass = 'bg-[#F59E0B]' // Orange

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[13px] font-bold text-slate-700 w-8">{percentage}%</span>
    </div>
  )
}

export function SensorTable() {
  const sensors = useManagementStore(state => state.devices)
  const addDevice = useManagementStore(state => state.addDevice)
  const updateDevice = useManagementStore(state => state.updateDevice)
  const deleteDevice = useManagementStore(state => state.deleteDevice)
  const zones = useManagementStore(state => state.zones)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Sensor | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100/50">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-[#245A34]" strokeWidth={2.5} />
          <h3 className="text-[18px] lg:text-[20px] font-bold text-[#245A34] tracking-tight">
            Mô-đun cảm biến IoT
          </h3>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-[#245A34] text-white text-[14px] font-bold rounded-full hover:bg-green-800 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" strokeWidth={3} />
          Thêm Module mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 uppercase">
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 w-1/4 pl-4">Tên Module/ID</th>
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 w-[15%]">Trạng thái</th>
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 w-[15%]">Khu vực</th>
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 w-1/6">Pin</th>
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 w-1/6">Tín hiệu cuối</th>
              <th className="py-4 text-[12px] font-bold tracking-wider text-slate-500 text-right pr-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => (
              <tr key={sensor.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                {/* Name / ID */}
                <td className="py-4 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                      <Share2 className={`w-6 h-6 ${sensor.status === 'online' ? 'text-[#245A34]' : 'text-slate-300'}`} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[15px] font-bold ${sensor.status === 'online' ? 'text-gray-900' : 'text-slate-400'}`}>{sensor.name}</span>
                      <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">ID: {sensor.id}</span>
                    </div>
                  </div>
                </td>
                
                {/* Status */}
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      sensor.status === 'online' ? 'bg-[#10B981]' : 'bg-slate-300'
                    }`} />
                    <span className={`text-[14px] font-bold capitalize ${
                      sensor.status === 'online' ? 'text-[#10B981]' : 'text-slate-400'
                    }`}>
                      {sensor.status}
                    </span>
                  </div>
                </td>

                {/* Zone Map */}
                <td className="py-4">
                  <span className={`text-[14px] font-bold ${sensor.status === 'online' ? 'text-slate-700' : 'text-slate-400'}`}>
                    {sensor.zoneId ? (zones.find(z => z.id === sensor.zoneId)?.name || 'Chưa gán') : 'Chưa gán'}
                  </span>
                </td>

                {/* Battery */}
                <td className="py-4">
                  <BatteryBar percentage={sensor.battery} />
                </td>

                {/* Last Signal */}
                <td className="py-4">
                  <span className={`text-[14px] font-medium ${sensor.status === 'online' ? 'text-slate-500' : 'text-slate-400'}`}>{sensor.lastSignal}</span>
                </td>

                {/* Actions */}
                <td className="py-4 pr-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-slate-400">
                    <button 
                      onClick={() => setEditingDevice(sensor)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:text-[#245A34] hover:bg-green-50 transition-colors"
                    >
                      <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => setDeletingId(sensor.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddDeviceModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        zones={zones}
        onAdd={(newDevice) => {
          const sensor: Sensor = {
            id: newDevice.id,
            name: newDevice.name,
            status: 'online',
            battery: 100,
            lastSignal: 'Vừa xong',
            zoneId: newDevice.zone
          }
          addDevice(sensor)
          toast.success("Thêm thiết bị thành công!")
        }}
      />

      <EditDeviceModal
        key={`${editingDevice?.id ?? 'closed'}-${zones.length}`}
        isOpen={!!editingDevice}
        onClose={() => setEditingDevice(null)}
        device={editingDevice}
        zones={zones}
        onEdit={(id, updates) => {
          updateDevice(id, { name: updates.name })
          toast.success("Cập nhật thiết bị thành công!")
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Xóa thiết bị"
        message="Bạn có chắc chắn muốn xóa thiết bị này? Hành động này không thể hoàn tác."
        onConfirm={() => {
          if (deletingId) {
            deleteDevice(deletingId)
            toast.success("Đã xóa thiết bị")
          }
        }}
      />
    </div>
  )
}
