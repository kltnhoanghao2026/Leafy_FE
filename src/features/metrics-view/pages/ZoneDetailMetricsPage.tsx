import { useParams, Navigate } from "react-router-dom";
import { MOCK_ZONES_DATA } from "../mockData";
import type { ZoneMetrics } from "../mockData";
import { useManagementStore } from "../../../store/useManagementStore";
import { ZoneTabSwitcher } from "../components/ZoneTabSwitcher";
import { HealthGaugesRow } from "../components/HealthGaugesRow";
import { IoTMetricCard } from "../components/IoTMetricCard";
import { RecentAlerts } from "../components/RecentAlerts";
import { ExpertRecommendations } from "../components/ExpertRecommendations";
import { QuickActions } from "../components/QuickActions";
import { Thermometer, Wind, Droplet, Sun } from "lucide-react";
import { ROUTES } from "../../../lib/routes";

export function ZoneDetailMetricsPage() {
  const { zoneId } = useParams();
  const storeZones = useManagementStore((state) => state.zones);

  // Find zone in store
  const storeZone = storeZones.find((z) => z.id === zoneId);

  // Validate route parameter against store
  if (!zoneId || !storeZone) {
    return <Navigate to={`${ROUTES.DASHBOARD.ROOT}/metrics`} replace />;
  }

  // Use mock metrics if available, otherwise generate default
  let zoneData = MOCK_ZONES_DATA[zoneId];
  if (!zoneData) {
    zoneData = {
      id: zoneId,
      name: storeZone.name,
      health: { healthy: 100, warning: 0, danger: 0 },
      sensors: {
        temperature: {
          value: 25.0,
          unit: "°C",
          change: 0,
          status: "good" as const,
          trend: [{ time: "12:00", value: 25 }],
        },
        humidity: {
          value: 65,
          unit: "%",
          change: 0,
          status: "good" as const,
          trend: [{ time: "12:00", value: 65 }],
        },
        soil: {
          value: 50,
          unit: "%",
          change: 0,
          status: "good" as const,
          trend: [{ time: "12:00", value: 50 }],
        },
        light: {
          value: 15000,
          unit: "Lux",
          change: 0,
          status: "good" as const,
          trend: [{ time: "12:00", value: 15000 }],
        },
      },
    } as ZoneMetrics;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Row: Title & Zone Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-bold text-[#111827] tracking-tight mb-1">
            Tổng quan vườn cà phê
          </h2>
          <p className="text-[#6B7280] text-[15px] font-medium">
            Sức khỏe cây trồng và thông số môi trường thực tế
          </p>
        </div>
        <ZoneTabSwitcher />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
        {/* Left Column: Gauges & Metrics Grid */}
        <div className="flex-1 space-y-6 lg:space-y-8">
          {/* Phase 2: Health Gauges */}
          <HealthGaugesRow health={zoneData.health} />

          {/* Phase 3: IoT Sensor Grid */}
          <div className="mt-8">
            <div className="flex items-center mb-6">
              <svg
                className="w-5 h-5 text-[#245A34] mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                Thông số cảm biến IoT
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <IoTMetricCard
                title="Nhiệt độ"
                icon={Thermometer}
                data={zoneData.sensors.temperature}
                colorClass="text-[#F97316]"
                barColor="#FB923C"
                iconBgClass="bg-[#FFF7ED]"
              />
              <IoTMetricCard
                title="Độ ẩm không khí"
                icon={Wind}
                data={zoneData.sensors.humidity}
                colorClass="text-[#3B82F6]"
                barColor="#60A5FA"
                iconBgClass="bg-[#EFF6FF]"
              />
              <IoTMetricCard
                title="Độ ẩm đất"
                icon={Droplet}
                data={zoneData.sensors.soil}
                colorClass="text-[#10B981]"
                barColor="#34D399"
                iconBgClass="bg-[#ECFDF5]"
              />
              <IoTMetricCard
                title="Cường độ ánh sáng"
                icon={Sun}
                data={zoneData.sensors.light}
                colorClass="text-[#EAB308]"
                barColor="#FACC15"
                iconBgClass="bg-[#FEFCE8]"
              />
            </div>
          </div>

          {/* Phase 5: Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column: Alerts & Experts (Phase 4) */}
        <div className="w-full xl:w-[380px] shrink-0">
          <RecentAlerts />
          <ExpertRecommendations />
        </div>
      </div>
    </div>
  );
}

export default ZoneDetailMetricsPage;
