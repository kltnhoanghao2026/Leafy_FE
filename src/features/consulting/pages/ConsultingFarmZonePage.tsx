import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, FlaskConical, LayoutGrid, List, Sprout } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingFarmPlot,
  useConsultingFarmZones,
  useConsultingPlants,
} from '../queries/consulting.queries';
import { useSpecies } from '../../plant-management';
import { PlantCard } from '../../plant-management/plant/components/PlantCard';

export function ConsultingFarmZonePage() {
  const { farmerProfileId, farmPlotId, farmZoneId } = useParams<{
    farmerProfileId: string;
    farmPlotId: string;
    farmZoneId: string;
  }>();

  const { data: plot, isLoading: plotLoading } = useConsultingFarmPlot(farmPlotId ?? '');
  const { data: zones, isLoading: zonesLoading } = useConsultingFarmZones(farmPlotId ?? '');
  const { data: allPlants, isLoading: plantsLoading } = useConsultingPlants(farmerProfileId ?? '');
  const { data: speciesList, isLoading: speciesLoading } = useSpecies();

  const zone = (zones ?? []).find(z => z.id === farmZoneId);
  const plants = (allPlants ?? []).filter((p) => p.farmZoneId === farmZoneId);
  
  const speciesById = new Map(speciesList?.map((s) => [s.id, s]) ?? []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const isLoading = plotLoading || zonesLoading || plantsLoading || speciesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="h-28 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <p>Khu vực không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link to={ROUTES.DASHBOARD.CONSULTING_FARM_PLOT(farmerProfileId ?? '', farmPlotId ?? '')} className="mt-4 text-[#245A34] font-semibold hover:underline">
          Quay lại trang trại
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING_FARM_PLOT(farmerProfileId ?? '', farmPlotId ?? '')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          {plot?.name ?? 'Trang trại'}
        </Link>
      </div>

      <header className="rounded-2xl bg-[#173F2A] p-6 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <FlaskConical className="h-3.5 w-3.5" />
              Farm zone consulting
            </div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">{zone.zoneName}</h1>
            {zone.zoneCode && (
              <div className="mt-2 inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <span className="font-mono text-sm text-emerald-50">{zone.zoneCode}</span>
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2">
              {zone.cropType && (
                <span className="bg-green-50/20 text-green-50 border border-green-100/30 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  {zone.cropType}
                </span>
              )}
              {zone.soilType && (
                <span className="bg-orange-50/20 text-orange-50 border border-orange-100/30 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                  {zone.soilType}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:min-w-48">
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15 text-center lg:text-right">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Cây trồng</p>
              <p className="text-2xl font-black">{plants.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Plants */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
            Danh sách cây trồng ({plants.length})
          </h2>
          {plants.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-white shadow text-[#245A34]' : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng lưới"
              >
                <LayoutGrid className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-1.5 transition ${viewMode === 'list' ? 'bg-white shadow text-[#245A34]' : 'text-slate-400 hover:text-slate-600'}`}
                title="Dạng danh sách"
              >
                <List className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
        
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <Sprout className="w-12 h-12 text-slate-300 mb-4" strokeWidth={1.5} />
            <p className="text-slate-500 font-medium">Chưa có cây trồng nào trong khu vực này.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                species={speciesById.get(plant.speciesId)}
                farmPlot={plot}
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId ?? '', plant.id)}
                hideActions={true}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                species={speciesById.get(plant.speciesId)}
                farmPlot={plot}
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId ?? '', plant.id)}
                hideActions={false}
                variant="list"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}