import { Select } from '../../../../components/ui/Select';
import type { FarmZoneResponse } from '../../shared/types';

type ScopeType = 'FARM' | 'FARM_ZONE' | 'PLANT';

interface ScopeSelectorProps {
  scopeType: ScopeType;
  onScopeTypeChange: (v: ScopeType) => void;
  farmPlotId: string;
  onFarmPlotChange: (v: string) => void;
  farmZoneId: string;
  onFarmZoneChange: (v: string) => void;
  plantId: string;
  onPlantIdChange: (v: string) => void;
  // Query data
  plotsData?: Array<{ id: string; name?: string }>;
  zonesData?: FarmZoneResponse[];
  plantsData?: Array<{ id: string; nickName?: string | null; plantNumber?: string | null }>;
  plotsLoading?: boolean;
  zonesLoading?: boolean;
  plantsLoading?: boolean;
}

export function ScopeSelector({
  scopeType,
  onScopeTypeChange,
  farmPlotId,
  onFarmPlotChange,
  farmZoneId,
  onFarmZoneChange,
  plantId,
  onPlantIdChange,
  plotsData = [],
  zonesData = [],
  plantsData = [],
  plotsLoading = false,
  zonesLoading = false,
  plantsLoading = false,
}: ScopeSelectorProps) {
  const handleScopeChange = (v: ScopeType) => {
    onScopeTypeChange(v);
    onFarmPlotChange('');
    onFarmZoneChange('');
    onPlantIdChange('');
  };

  const handlePlotChange = (v: string) => {
    onFarmPlotChange(String(v));
    onFarmZoneChange('');
  };

  const filteredZones = zonesData.filter(
    zone => !farmPlotId || zone.farmPlotId === farmPlotId,
  );

  return (
    <>
      {/* Scope type */}
      <div>
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Phạm vi
        </span>
        <Select
          className="mt-2"
          value={scopeType}
          onChange={v => handleScopeChange(v as ScopeType)}
          options={[
            { value: 'FARM', label: 'Vườn (Farm)' },
            { value: 'FARM_ZONE', label: 'Khu vực (Farm Zone)' },
            { value: 'PLANT', label: 'Cây (Plant)' },
          ]}
        />
      </div>

      {/* Farm Plot */}
      <div>
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Vườn
        </span>
        <Select
          className="mt-2"
          value={farmPlotId}
          onChange={handlePlotChange}
          disabled={plotsLoading}
          placeholder={plotsLoading ? 'Đang tải...' : 'Chọn vườn...'}
          options={[
            { value: '', label: '— Chọn vườn —' },
            ...plotsData.map(p => ({
              value: p.id,
              label: p.name ?? p.id,
            })),
          ]}
        />
      </div>

      {/* Farm Zone */}
      <div>
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Khu vực
        </span>
        <Select
          className="mt-2"
          value={farmZoneId}
          onChange={v => onFarmZoneChange(String(v))}
          disabled={zonesLoading}
          placeholder={zonesLoading ? 'Đang tải...' : 'Chọn khu vực...'}
          options={[
            { value: '', label: '— Chọn khu vực —' },
            ...filteredZones.map(z => ({
              value: z.id,
              label: z.zoneName ?? z.id,
            })),
          ]}
        />
      </div>

      {/* Plant */}
      {scopeType === 'PLANT' && (
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Cây
          </span>
          <Select
            className="mt-2"
            value={plantId}
            onChange={v => onPlantIdChange(String(v))}
            disabled={plantsLoading}
            placeholder={plantsLoading ? 'Đang tải...' : 'Chọn cây...'}
            options={[
              { value: '', label: '— Chọn cây —' },
              ...plantsData.map(p => ({
                value: p.id,
                label: p.nickName || p.plantNumber || p.id,
              })),
            ]}
          />
        </div>
      )}
    </>
  );
}
