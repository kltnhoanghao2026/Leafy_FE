import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, FlaskConical, LayoutGrid, List, MapPin, Sprout, Tag } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingFarmPlot,
  useConsultingFarmZones,
  useConsultingPlants,
} from '../queries/consulting.queries';
import type { PlantStatus } from '../../plant-management/shared/types';

import { PlantCard } from '../../plant-management/plant/components/PlantCard';
import { useSpecies } from '../../plant-management';

const plantStatusLabel: Record<PlantStatus, string> = {
  ACTIVE: 'Đang phát triển',
  INACTIVE: 'Ngừng hoạt động',
  ARCHIVED: 'Đã lưu trữ',
};

const plantStatusColor: Record<PlantStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  ARCHIVED: 'bg-amber-100 text-amber-600',
};

export function ConsultingFarmPlotPage() {
  const { farmerProfileId, farmPlotId } = useParams<{
    farmerProfileId: string;
    farmPlotId: string;
  }>();
  const navigate = useNavigate();

  const { data: plot, isLoading: plotLoading } = useConsultingFarmPlot(farmPlotId ?? '');
  const { data: zones, isLoading: zonesLoading } = useConsultingFarmZones(farmPlotId ?? '');
  const { data: allPlants, isLoading: plantsLoading } = useConsultingPlants(farmerProfileId ?? '');
  const { data: speciesList, isLoading: speciesLoading } = useSpecies();

  const plants = (allPlants ?? []).filter((p) => p.farmPlotId === farmPlotId);
  const isLoading = plotLoading || zonesLoading || plantsLoading || speciesLoading;

  const speciesById = new Map(speciesList?.map((s) => [s.id, s]) ?? []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD.CONSULTING_FARMER(farmerProfileId ?? '')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#245A34] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          Trang trại
        </Link>
      </div>

      <header className="rounded-2xl bg-[#173F2A] p-6 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              <MapPin className="h-3.5 w-3.5" />
              Farm plot consulting
            </p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">{plot?.name ?? farmPlotId}</h1>
            {plot?.code && (
              <div className="mt-2 inline-flex items-center rounded-lg bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
                <span className="font-mono text-sm text-emerald-50">{plot.code}</span>
              </div>
            )}
            {plot?.description && (
              <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-emerald-50/90">{plot.description}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-64">
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Khu vực</p>
              <p className="text-2xl font-black">{(zones ?? []).length}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/15">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-100">Cây trồng</p>
              <p className="text-2xl font-black">{plants.length}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Zones */}
      <section className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-[#245A34]" strokeWidth={2.5} />
          Khu vực canh tác ({(zones ?? []).length})
        </h2>
        {(zones ?? []).length === 0 ? (
           <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center">
             <p className="px-6 text-sm font-semibold text-slate-500">Chưa có khu vực nào được cấu hình cho trang trại này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {(zones ?? []).map((zone) => (
              <button
                type="button"
                onClick={() => navigate(ROUTES.DASHBOARD.CONSULTING_FARM_ZONE(farmerProfileId ?? '', plot?.id ?? '', zone.id))}
                key={zone.id}
                className="group relative flex min-h-36 cursor-pointer text-left flex-col gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#245A34] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div>
                  <p className="font-extrabold text-slate-800 text-lg truncate" title={zone.zoneName}>{zone.zoneName}</p>
                  {zone.zoneCode && (
                    <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-wider uppercase">{zone.zoneCode}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-slate-50">
                  {zone.cropType && (
                    <span className="bg-green-50/80 text-[#245A34] border border-green-100/50 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      {zone.cropType}
                    </span>
                  )}
                  {zone.soilType && (
                    <span className="bg-orange-50/80 text-orange-700 border border-orange-100/50 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      {zone.soilType}
                    </span>
                  )}
                  {zone.areaM2 != null && (
                    <span className="bg-blue-50/80 text-blue-700 border border-blue-100/50 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      {zone.areaM2.toLocaleString('vi-VN')} m²
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

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
            <p className="text-slate-500 font-medium">Chưa có cây trồng nào trong trang trại này.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                species={speciesById.get(plant.speciesId)}
                farmPlot={plot}
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId ?? "", plant.id)}
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
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId ?? "", plant.id)}
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

