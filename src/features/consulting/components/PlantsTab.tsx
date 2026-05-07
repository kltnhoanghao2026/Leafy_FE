import { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, Sprout } from 'lucide-react';
import { ROUTES } from '../../../lib/routes';
import {
  useConsultingFarmPlots,
  useConsultingFarmZones,
  useConsultingPlants,
} from '../queries/consulting.queries';
import { useSpecies } from '../../plant-management';
import { PlantCard } from '../../plant-management/plant/components/PlantCard';
import { Select } from '../../../components/ui/Select';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import type { PlantResponse, PlantStatus, SpeciesResponse } from '../../plant-management/shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const plantStatusLabel: Record<PlantStatus, string> = {
  ACTIVE: 'Đang phát triển',
  INACTIVE: 'Ngừng hoạt động',
  ARCHIVED: 'Đã lưu trữ',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSpeciesDisplayName(
  plant: PlantResponse,
  speciesById: Map<string, SpeciesResponse>,
) {
  const species = speciesById.get(plant.speciesId);
  return species?.commonName || species?.cultivarName || 'Chưa rõ giống cây';
}

// ── Zone filter select ────────────────────────────────────────────────────────

function ZoneFilterSelect({
  farmPlotId,
  value,
  onChange,
}: {
  farmPlotId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const zonesQuery = useConsultingFarmZones(farmPlotId, Boolean(farmPlotId));
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const zoneOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả khu vực' },
      ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
    ],
    [zones],
  );

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as string)}
      options={zoneOptions}
      placeholder="Tất cả khu vực"
      disabled={!farmPlotId || zonesQuery.isLoading}
    />
  );
}

// ── PlantsTab ─────────────────────────────────────────────────────────────────

export function PlantsTab({ farmerProfileId }: { farmerProfileId: string }) {
  const plantsQuery = useConsultingPlants(farmerProfileId);
  const { data: farmPlots } = useConsultingFarmPlots(farmerProfileId, !!farmerProfileId);
  const speciesQuery = useSpecies();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [farmPlotFilter, setFarmPlotFilter] = useState('');
  const [farmZoneFilter, setFarmZoneFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PlantStatus | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const plots = useMemo(() => farmPlots ?? [], [farmPlots]);
  const species = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  const speciesById = useMemo(
    () => new Map(species.map((item) => [item.id, item])),
    [species],
  );
  const farmPlotById = useMemo(
    () => new Map(plots.map((plot) => [plot.id, plot])),
    [plots],
  );

  const farmPlotOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả vườn' },
      ...plots.map((plot) => ({ value: plot.id, label: plot.name })),
    ],
    [plots],
  );

  const statusOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả trạng thái' },
      ...Object.entries(plantStatusLabel).map(([status, label]) => ({ value: status, label })),
    ],
    [],
  );

  const speciesOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả giống cây' },
      ...species.map((item) => ({
        value: item.id,
        label: [item.commonName, item.cultivarName].filter(Boolean).join(' - ') || item.id,
      })),
    ],
    [species],
  );

  const filteredPlants = useMemo(() => {
    const searchKeyword = debouncedSearch.trim().toLowerCase();
    return plants.filter((plant) => {
      if (farmPlotFilter && plant.farmPlotId !== farmPlotFilter) return false;
      if (farmZoneFilter && plant.farmZoneId !== farmZoneFilter) return false;
      if (speciesFilter && plant.speciesId !== speciesFilter) return false;
      if (statusFilter && plant.plantStatus !== statusFilter) return false;
      if (!searchKeyword) return true;
      const speciesName = getSpeciesDisplayName(plant, speciesById);
      const searchableContent = [plant.nickName, plant.plantNumber, plant.tagCode, speciesName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchableContent.includes(searchKeyword);
    });
  }, [plants, debouncedSearch, farmPlotFilter, farmZoneFilter, speciesFilter, statusFilter, speciesById]);

  const activeCount = useMemo(
    () => plants.filter((plant) => plant.plantStatus === 'ACTIVE').length,
    [plants],
  );

  const hasFilters =
    debouncedSearch.trim().length > 0 ||
    Boolean(farmPlotFilter || farmZoneFilter || speciesFilter || statusFilter);

  if (plantsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (plantsQuery.isError) {
    return (
      <div className="space-y-4 pt-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-black text-red-700">Có lỗi xảy ra khi tải danh sách cây trồng.</p>
          <button
            type="button"
            onClick={() => void plantsQuery.refetch()}
            className="mt-3 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <Sprout className="w-12 h-12 text-slate-300 mb-4" strokeWidth={1.5} />
        <p className="text-slate-500 font-semibold">Nông dân này chưa có cây trồng nào.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* Title row */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-slate-900">Lọc cây trồng tư vấn</p>
            <p className="text-xs font-semibold text-slate-500">
              {filteredPlants.length} / {plants.length} cây hiển thị · {activeCount} cây đang phát triển
            </p>
          </div>
          {/* Grid / List toggle */}
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
        </div>

        {/* Filters – single row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex h-9 min-w-45 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="consulting-plant-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên cây, mã cây, tag..."
              className="flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none"
            />
          </div>

          {/* Farm plot */}
          <div className="h-9 min-w-35 flex-1">
            <Select
              value={farmPlotFilter}
              onChange={(val) => {
                setFarmPlotFilter(val as string);
                setFarmZoneFilter('');
              }}
              options={farmPlotOptions}
              placeholder="Tất cả vườn"
            />
          </div>

          {/* Zone – only when plot selected */}
          {farmPlotFilter ? (
            <div className="h-9 min-w-35 flex-1">
              <ZoneFilterSelect
                farmPlotId={farmPlotFilter}
                value={farmZoneFilter}
                onChange={setFarmZoneFilter}
              />
            </div>
          ) : null}

          {/* Status */}
          <div className="h-9 min-w-35 flex-1">
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as PlantStatus | '')}
              options={statusOptions}
              placeholder="Tất cả trạng thái"
            />
          </div>

          {/* Species */}
          <div className="h-9 min-w-40 flex-1">
            <Select
              value={speciesFilter}
              onChange={(val) => setSpeciesFilter(val as string)}
              options={speciesOptions}
              placeholder="Tất cả giống cây"
            />
          </div>
        </div>
      </section>

      <div>
        {filteredPlants.length === 0 ? (
          <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <Sprout className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
            <p className="font-semibold text-slate-600">
              {hasFilters
                ? 'Không có cây trồng phù hợp bộ lọc hiện tại.'
                : 'Nông dân này chưa có cây trồng nào.'}
            </p>
            {hasFilters && (
              <p className="mt-1 text-sm font-medium text-slate-500">
                Hãy thử bỏ bớt điều kiện lọc hoặc dùng từ khóa khác.
              </p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-5 pb-2 lg:grid-cols-2">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                species={speciesById.get(plant.speciesId)}
                farmPlot={farmPlotById.get(plant.farmPlotId)}
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId, plant.id)}
                hideActions={false}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-2">
            {filteredPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                species={speciesById.get(plant.speciesId)}
                farmPlot={farmPlotById.get(plant.farmPlotId)}
                detailUrl={ROUTES.DASHBOARD.CONSULTING_PLANT(farmerProfileId, plant.id)}
                hideActions={false}
                variant="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
