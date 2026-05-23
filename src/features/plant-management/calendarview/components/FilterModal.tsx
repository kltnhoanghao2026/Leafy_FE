import { useState } from 'react';
import { Leaf, ClipboardCheck, TreePine, LayoutGrid } from 'lucide-react';
import { useFarmPlots, useFarmZonesByOwner } from '../../../farm-management/queries';
import { useMyPlants } from '../..';
import { ModalShell } from '../../../../components/ui/ModalShell';
import { Select } from '../../../../components/ui/Select';
import { PlantSelectModal } from './PlantSelectModal';
import { PlanApplySelectModal } from './PlanApplySelectModal';
import { FarmPlotSelectModal } from './FarmPlotSelectModal';
import { FarmZoneSelectModal } from './FarmZoneSelectModal';
import type { PlanApplyResponse } from '../../shared/types';
import { EVENT_TYPE_OPTIONS } from '../schemas/eventConstants';
import type { FilterState } from '../schemas/calendar.types';
import { useTranslation } from '../../../../i18n';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  applies: PlanApplyResponse[];
  ownerProfileId: string;
  applyLabel: (apply: PlanApplyResponse) => string;
}

export function FilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onClear,
  applies,
  ownerProfileId,
  applyLabel,
}: FilterModalProps) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [isPlanApplyModalOpen, setIsPlanApplyModalOpen] = useState(false);
  const [isFarmPlotModalOpen, setIsFarmPlotModalOpen] = useState(false);
  const [isFarmZoneModalOpen, setIsFarmZoneModalOpen] = useState(false);
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZonesByOwner(ownerProfileId, !!ownerProfileId);
  const plantsQuery = useMyPlants({ size: 100 });

  const filteredZones = (zonesQuery.data ?? []).filter(
    zone => !localFilters.farmPlotId || zone.farmPlotId === localFilters.farmPlotId,
  );

  const selectedPlant = (plantsQuery.data?.content ?? []).find(p => p.id === localFilters.plantId);
  const selectedApply = applies.find(a => a.id === localFilters.selectedApplyId);
  const selectedPlot = (plotsQuery.data ?? []).find(p => p.id === localFilters.farmPlotId);
  const selectedZone = filteredZones.find(z => z.id === localFilters.farmZoneId);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FilterState = {
      farmPlotId: '',
      farmZoneId: '',
      plantId: '',
      targetType: '',
      eventType: '',
      selectedApplyId: '',
    };
    setLocalFilters(cleared);
    onClear();
    onClose();
  };

  const handleTargetTypeChange = (v: string | number) => {
    setLocalFilters(prev => ({ ...prev, targetType: String(v), farmPlotId: '', farmZoneId: '', plantId: '' }));
  };

  return (
    <>
      <ModalShell
        onClose={onClose}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {t('plantManagement.filterModal.clear')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#245A34] rounded-lg hover:bg-[#1e4a2c] transition-colors"
              >
                {t('plantManagement.filterModal.apply')}
              </button>
            </div>
          </div>
        }
      >
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Event type */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.filterModal.eventTypeSection')}</label>
            <Select
              className="mt-1"
              value={localFilters.eventType}
              onChange={v => setLocalFilters(prev => ({ ...prev, eventType: String(v) }))}
              placeholder={t('plantManagement.filterModal.allEventTypes')}
              options={[
                { value: '', label: t('plantManagement.filterModal.allEventTypes') },
                ...EVENT_TYPE_OPTIONS.map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>

          {/* Scope */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.filterModal.targetTypeSection')}</label>
            <Select
              className="mt-1"
              value={localFilters.targetType}
              onChange={handleTargetTypeChange}
              placeholder={t('plantManagement.filterModal.targetTypeAll')}
              options={[
                { value: '', label: t('plantManagement.filterModal.targetTypeAll') },
                { value: 'FARM', label: t('plantManagement.filterModal.targetTypeFarm') },
                { value: 'FARM_ZONE', label: t('plantManagement.filterModal.targetTypeZone') },
                { value: 'PLANT', label: t('plantManagement.filterModal.targetTypePlant') },
              ]}
            />
          </div>

          {/* Plot */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.calendar.filterFarm')}</label>
            <button
              type="button"
              onClick={() => setIsFarmPlotModalOpen(true)}
              className="mt-1 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all"
            >
              <span className={!localFilters.farmPlotId ? "text-slate-400" : ""}>
                {selectedPlot ? selectedPlot.name : t('plantManagement.filterModal.allFarms')}
              </span>
              <TreePine className={`h-4 w-4 shrink-0 ${localFilters.farmPlotId ? "text-[#245A34]" : "text-slate-400"}`} />
            </button>
          </div>

          {/* Zone — shown when targetType is FARM_ZONE, PLANT, or not set */}
          {(localFilters.targetType === 'FARM_ZONE' || localFilters.targetType === 'PLANT' || localFilters.targetType === '') && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.calendar.filterZone')}</label>
              <button
                type="button"
                onClick={() => setIsFarmZoneModalOpen(true)}
                className="mt-1 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all"
              >
                <span className={!localFilters.farmZoneId ? "text-slate-400" : ""}>
                  {selectedZone ? selectedZone.zoneName : t('plantManagement.filterModal.allZones')}
                </span>
                <LayoutGrid className={`h-4 w-4 shrink-0 ${localFilters.farmZoneId ? "text-[#245A34]" : "text-slate-400"}`} />
              </button>
            </div>
          )}

          {/* Plant — shown when targetType is PLANT or not set */}
          {(localFilters.targetType === 'PLANT' || localFilters.targetType === '') && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t('plantManagement.calendar.filterPlant')}</label>
              <button
                type="button"
                onClick={() => setIsPlantModalOpen(true)}
                className="mt-1 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all"
              >
                <span className={!localFilters.plantId ? "text-slate-400" : ""}>
                  {selectedPlant
                    ? (selectedPlant.nickName || selectedPlant.plantNumber || selectedPlant.tagCode || t('plantManagement.calendar.filterPlant'))
                    : t('plantManagement.filterModal.allPlants')}
                </span>
                <Leaf className={`h-4 w-4 shrink-0 ${localFilters.plantId ? "text-[#245A34]" : "text-slate-400"}`} />
              </button>
            </div>
          )}

          {/* Plan */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {t('plantManagement.filterModal.selectPlan')}
            </label>
            <button
              type="button"
              onClick={() => setIsPlanApplyModalOpen(true)}
              className="mt-1 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all"
            >
              <span className={!localFilters.selectedApplyId ? "text-slate-400" : ""}>
                {selectedApply
                  ? applyLabel(selectedApply)
                  : t('plantManagement.filterModal.allPlans')}
              </span>
              <ClipboardCheck className={`h-4 w-4 shrink-0 ${localFilters.selectedApplyId ? "text-[#245A34]" : "text-slate-400"}`} />
            </button>
          </div>
        </div>
      </ModalShell>

      <PlantSelectModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        selectedPlantId={localFilters.plantId}
        onSelect={(plantId) => setLocalFilters(prev => ({ ...prev, plantId }))}
        plants={plantsQuery.data?.content ?? []}
        farmPlotId={localFilters.farmPlotId || undefined}
        farmZoneId={localFilters.farmZoneId || undefined}
        isLoading={plantsQuery.isLoading}
      />

      <PlanApplySelectModal
        isOpen={isPlanApplyModalOpen}
        onClose={() => setIsPlanApplyModalOpen(false)}
        selectedApplyId={localFilters.selectedApplyId}
        onSelect={(applyId) => setLocalFilters(prev => ({ ...prev, selectedApplyId: applyId }))}
        applies={applies}
        applyLabel={applyLabel}
      />

      <FarmPlotSelectModal
        isOpen={isFarmPlotModalOpen}
        onClose={() => setIsFarmPlotModalOpen(false)}
        selectedPlotId={localFilters.farmPlotId}
        onSelect={(plotId) => setLocalFilters(prev => ({ ...prev, farmPlotId: plotId, farmZoneId: plotId ? prev.farmZoneId : '' }))}
        plots={plotsQuery.data ?? []}
        isLoading={plotsQuery.isLoading}
      />

      <FarmZoneSelectModal
        isOpen={isFarmZoneModalOpen}
        onClose={() => setIsFarmZoneModalOpen(false)}
        selectedZoneId={localFilters.farmZoneId}
        onSelect={(zoneId) => setLocalFilters(prev => ({ ...prev, farmZoneId: zoneId }))}
        zones={filteredZones}
        isLoading={zonesQuery.isLoading}
      />
    </>
  );
}
