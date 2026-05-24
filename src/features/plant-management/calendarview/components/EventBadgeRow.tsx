import { useNavigate } from 'react-router-dom';
import { CalendarDays, Leaf, MapPin } from 'lucide-react';
import { ROUTES } from '../../../../lib/routes';
import type { PlantEventResponse } from '../../shared/types';

interface EventBadgeRowProps {
  event: PlantEventResponse;
}

export function EventBadgeRow({ event }: EventBadgeRowProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Plant badge */}
      {event.plant && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD.PLANT_DETAIL(event.plantId))}
          className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <Leaf className="h-2.5 w-2.5" />
          {event.plant.nickName || event.plant.plantNumber || event.plant.tagCode || event.plant.id.slice(0, 8)}
        </button>
      )}
      {/* Farm Zone badge */}
      {event.farmZone?.zoneName && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD.FARM_ZONE_DETAIL(event.farmPlotId ?? '', event.farmZoneId ?? ''))}
          className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <MapPin className="h-2.5 w-2.5" />
          {event.farmZone.zoneName}
        </button>
      )}
      {/* Farm Plot badge (only if no zone) */}
      {event.farmPlot?.name && !event.farmZone?.zoneName && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD.FARM_PLOT_DETAIL(event.farmPlotId ?? ''))}
          className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <MapPin className="h-2.5 w-2.5" />
          {event.farmPlot.name}
        </button>
      )}
      {/* Plan Apply badge */}
      {event.planApply && (
        <button
          type="button"
          onClick={() => navigate(ROUTES.DASHBOARD.PLAN_DETAIL(event.planApply.planId ?? ''))}
          className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 hover:bg-purple-100 transition-colors"
        >
          <CalendarDays className="h-2.5 w-2.5" />
          {event.planApply.planName || event.planApply.diseaseName || 'Kế hoạch'}
        </button>
      )}
    </>
  );
}
