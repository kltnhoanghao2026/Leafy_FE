import { FarmInfoCard } from '../components/FarmInfoCard'
import { ZoneManager } from '../components/ZoneManager'
import { SensorTable } from '../components/SensorTable'

export function DeviceManagementPage() {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div>
        <h2 className="text-[28px] lg:text-[32px] font-bold text-[#111827] tracking-tight mb-1">
          Quản lý Vườn & Thiết bị
        </h2>
        <p className="text-[#6B7280] text-[14px] lg:text-[15px] font-medium max-w-2xl">
          Cấu hình thông tin nông trại, phân lô vườn trồng và theo dõi chi tiết trạng thái thiết bị IoT được lắp đặt.
        </p>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Phase 2: Farm Info Card */}
        <section>
          <FarmInfoCard />
        </section>

        {/* Phase 3: Zone Grid */}
        <section>
          <ZoneManager />
        </section>

        {/* Phase 4: Sensor Table */}
        <section>
          <SensorTable />
        </section>
      </div>

    </div>
  )
}
