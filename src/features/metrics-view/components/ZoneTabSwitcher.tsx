import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useDashboardStore } from "../../../store/dashboardStore";
import { useManagementStore } from "../../../store/useManagementStore";
import { ROUTES } from "../../../lib/routes";

export function ZoneTabSwitcher() {
  const navigate = useNavigate();
  const { zoneId } = useParams();
  const { selectedZoneId, setSelectedZoneId } = useDashboardStore();
  const zones = useManagementStore((state) => state.zones);

  useEffect(() => {
    if (zoneId && zoneId !== selectedZoneId) {
      if (zones.find((z) => z.id === zoneId)) {
        setSelectedZoneId(zoneId);
      } else if (zones.length > 0) {
        navigate(ROUTES.DASHBOARD.ZONE_METRICS(zones[0].id), { replace: true });
      } else {
        navigate(ROUTES.DASHBOARD.ROOT, { replace: true });
      }
    }
  }, [zoneId, selectedZoneId, setSelectedZoneId, navigate, zones]);

  const handleTabClick = (id: string) => {
    setSelectedZoneId(id);
    navigate(ROUTES.DASHBOARD.ZONE_METRICS(id));
  };

  return (
    <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm shrink-0">
      {zones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => handleTabClick(zone.id)}
          className={`px-8 py-2.5 rounded-full text-[14px] font-bold transition-all duration-200 whitespace-nowrap ${
            selectedZoneId === zone.id
              ? "bg-[#245A34] text-white shadow-md"
              : "text-slate-500 hover:text-[#245A34] hover:bg-slate-50"
          }`}
        >
          {zone.name}
        </button>
      ))}
    </div>
  );
}
