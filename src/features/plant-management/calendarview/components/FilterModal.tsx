import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { useFarmPlots, useFarmZonesByOwner } from '../../../farm-management/queries';
import { usePlants } from '../..';
import { Select } from '../../../../components/ui/Select';
import type { PlanApplyResponse } from '../../shared/types';
import { EVENT_TYPE_OPTIONS } from '../schemas/eventConstants';
import type { FilterState } from '../schemas/calendar.types';

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
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZonesByOwner(ownerProfileId, !!ownerProfileId);
  const plantsQuery = usePlants();

  // Filter zones client-side by selected plot (or show all if no plot selected)
  const filteredZones = (zonesQuery.data ?? []).filter(
    zone => !localFilters.farmPlotId || zone.farmPlotId === localFilters.farmPlotId,
  );

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

  const handleFarmPlotChange = (v: string) => {
    setLocalFilters(prev => ({ ...prev, farmPlotId: String(v), farmZoneId: '' }));
  };

  const handleFarmZoneChange = (v: string) => {
    setLocalFilters(prev => ({ ...prev, farmZoneId: String(v) }));
  };

  const handleTargetTypeChange = (v: string) => {
    setLocalFilters(prev => ({ ...prev, targetType: String(v), farmPlotId: '', farmZoneId: '', plantId: '' }));
  };

  const activeFilterCount = [
    filters.farmPlotId,
    filters.farmZoneId,
    filters.plantId,
    filters.targetType,
    filters.eventType,
    filters.selectedApplyId,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#245A34]" />
            <h3 className="text-lg font-bold text-slate-900">Bộ lọc</h3>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-[#245A34] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Loại sự kiện */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Loại sự kiện</label>
            <Select
              className="mt-1"
              value={localFilters.eventType}
              onChange={v => setLocalFilters(prev => ({ ...prev, eventType: String(v) }))}
              placeholder="Tất cả loại sự kiện"
              options={[
                { value: '', label: 'Tất cả loại sự kiện' },
                ...EVENT_TYPE_OPTIONS.map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>

          {/* Phạm vi */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Phạm vi</label>
            <Select
              className="mt-1"
              value={localFilters.targetType}
              onChange={handleTargetTypeChange}
              placeholder="Tất cả phạm vi"
              options={[
                { value: '', label: 'Tất cả phạm vi' },
                { value: 'FARM', label: 'Vườn' },
                { value: 'FARM_ZONE', label: 'Khu vực' },
                { value: 'PLANT', label: 'Cây' },
              ]}
            />
          </div>

          {/* Vườn — always visible */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Vườn</label>
            <Select
              className="mt-1"
              value={localFilters.farmPlotId}
              onChange={handleFarmPlotChange}
              placeholder="Tất cả vườn"
              options={[
                { value: '', label: 'Tất cả vườn' },
                ...(plotsQuery.data ?? []).map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          {/* Khu vực — shown when targetType is FARM_ZONE, PLANT, or not set */}
          {(localFilters.targetType === 'FARM_ZONE' || localFilters.targetType === 'PLANT' || localFilters.targetType === '') && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Khu vực</label>
              <Select
                className="mt-1"
                value={localFilters.farmZoneId}
                onChange={handleFarmZoneChange}
                disabled={zonesQuery.isLoading}
                placeholder={zonesQuery.isLoading ? 'Đang tải...' : 'Tất cả khu vực'}
                options={[
                  { value: '', label: 'Tất cả khu vực' },
                  ...filteredZones.map(z => ({ value: z.id, label: z.zoneName })),
                ]}
              />
            </div>
          )}

          {/* Cây — shown when targetType is PLANT or not set */}
          {(localFilters.targetType === 'PLANT' || localFilters.targetType === '') && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Cây</label>
              <Select
                className="mt-1"
                value={localFilters.plantId}
                onChange={v => setLocalFilters(prev => ({ ...prev, plantId: String(v) }))}
                placeholder="Tất cả cây"
                options={[
                  { value: '', label: 'Tất cả cây' },
                  ...(plantsQuery.data ?? []).map(p => ({
                    value: p.id,
                    label: p.nickName || p.plantNumber || p.id,
                  })),
                ]}
              />
            </div>
          )}

          {/* Áp dụng kế hoạch */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Áp dụng kế hoạch
            </label>
            <Select
              className="mt-1"
              value={localFilters.selectedApplyId}
              onChange={v => setLocalFilters(prev => ({ ...prev, selectedApplyId: String(v) }))}
              placeholder="Tất cả áp dụng"
              options={[
                { value: '', label: 'Tất cả áp dụng' },
                ...applies.map(a => ({
                  value: a.id,
                  label: applyLabel(a),
                })),
              ]}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Xóa bộ lọc
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#245A34] rounded-lg hover:bg-[#1e4a2c] transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
