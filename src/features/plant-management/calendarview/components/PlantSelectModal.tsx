import { useState, useMemo } from "react";
import { Search, Leaf, List } from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import type { PlantResponse } from "../../shared/types";
import { useTranslation } from "../../../../i18n";

interface PlantSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlantId: string;
  onSelect: (plantId: string) => void;
  plants: PlantResponse[];
  farmPlotId?: string;
  farmZoneId?: string;
  isLoading?: boolean;
}

function PlantSelectCard({
  plant,
  isSelected,
  onClick,
  t,
}: {
  plant: PlantResponse;
  isSelected: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const statusLabel = plant.plantStatus
    ? t(`plantManagement.status.${plant.plantStatus}`)
    : plant.plantStatus;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? "border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20"
          : "border-slate-100 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${isSelected ? "bg-[#245A34]/10" : "bg-slate-100"}`}>
            <Leaf className={`h-3.5 w-3.5 ${isSelected ? "text-[#245A34]" : "text-slate-400"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#245A34]">
              {plant.plantNumber || plant.tagCode || "—"}
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {plant.nickName || "—"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {plant.speciesId || "—"}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {plant.plantStatus && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
              plant.plantStatus === "ACTIVE"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : plant.plantStatus === "INACTIVE"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}>
              {statusLabel}
            </span>
          )}
          {isSelected && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#245A34]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#245A34]" />
              {t('plantManagement.plantSelect.selected')}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {plant.plantingDate && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plantSelect.plantingDate')}</p>
            <p className="mt-0.5 text-xs font-bold text-slate-700">{plant.plantingDate}</p>
          </div>
        )}
        {plant.batchNumber && (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.plantSelect.batch')}</p>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-700">{plant.batchNumber}</p>
          </div>
        )}
      </div>
    </button>
  );
}

export function PlantSelectModal({
  isOpen,
  onClose,
  selectedPlantId,
  onSelect,
  plants,
  farmPlotId,
  farmZoneId,
  isLoading,
}: PlantSelectModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const scopedPlants = useMemo(() => {
    let result = plants;
    if (farmPlotId) result = result.filter(p => p.farmPlotId === farmPlotId);
    if (farmZoneId) result = result.filter(p => p.farmZoneId === farmZoneId);
    return result;
  }, [plants, farmPlotId, farmZoneId]);

  const filteredPlants = useMemo(() => {
    if (!search.trim()) return scopedPlants;
    const q = search.toLowerCase();
    return scopedPlants.filter(
      (p) =>
        (p.nickName ?? "").toLowerCase().includes(q) ||
        (p.plantNumber ?? "").toLowerCase().includes(q) ||
        (p.tagCode ?? "").toLowerCase().includes(q) ||
        (p.batchNumber ?? "").toLowerCase().includes(q),
    );
  }, [scopedPlants, search]);

  if (!isOpen) return null;

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  return (
    <ModalShell
      onClose={onClose}
      icon={<Leaf className="h-5 w-5 text-[#245A34]" />}
      title={t('plantManagement.plantSelect.title')}
      subtitle={
        selectedPlant ? (
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">
            {t('plantManagement.plantSelect.selected')}: <span className="font-normal text-slate-500">
              {selectedPlant.nickName || selectedPlant.plantNumber || selectedPlant.tagCode || "—"}
            </span>
          </p>
        ) : undefined
      }
      maxWidth="sm:max-w-3xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { onSelect(""); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('plantManagement.plantSelect.clearSelection')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#245A34] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1e4a2c] transition-colors"
          >
            {t('common.confirm')}
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="px-6 py-3 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('plantManagement.plantSelect.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-[#245A34] focus:outline-none focus:ring-1 focus:ring-[#245A34]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200"
            >
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="px-6 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#245A34] border-t-transparent" />
            <p className="text-sm font-semibold text-slate-400">{t('plantManagement.plantSelect.loadingPlants')}</p>
          </div>
        ) : filteredPlants.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Leaf className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-semibold text-slate-400">
              {search ? t('plantManagement.plantSelect.noPlants') : t('plantManagement.plantSelect.noPlantsInScope')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* All plants option */}
            <button
              type="button"
              onClick={() => { onSelect(""); onClose(); }}
              className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                !selectedPlantId
                  ? "border-[#245A34] bg-emerald-50/30 ring-2 ring-[#245A34]/20"
                  : "border-slate-100 bg-white shadow-sm hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-full p-2 ${!selectedPlantId ? "bg-[#245A34]/10" : "bg-slate-100"}`}>
                  <List className={`h-4 w-4 ${!selectedPlantId ? "text-[#245A34]" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{t('plantManagement.filterModal.allPlants')}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {search ? `${filteredPlants.length} ${t('plantManagement.plantSelect.noPlants')}` : `${scopedPlants.length} ${t('plantManagement.common.plant')}`}
                  </p>
                </div>
              </div>
            </button>
            {filteredPlants.map((plant) => (
              <PlantSelectCard
                key={plant.id}
                plant={plant}
                isSelected={plant.id === selectedPlantId}
                onClick={() => { onSelect(plant.id); onClose(); }}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
