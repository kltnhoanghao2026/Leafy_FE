import { useEffect, useMemo } from "react";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { usePlants } from '../../plant-management';
import { useMyProfile } from "../../settings/queries";
import type { FarmPlotResponse, FarmZoneResponse } from "../../farm-management/types";
import type { PlantResponse } from '../../plant-management/shared/types';
import { Select } from "../../../components/ui/Select";

export interface DiagnosisPlantContext {
  plantId?: string;
  plantName?: string;
  farmPlotId?: string;
  farmPlotName?: string;
  farmZoneId?: string;
  farmZoneName?: string;
}

interface DiagnosisPlantSelectorProps {
  value: DiagnosisPlantContext;
  onChange: (value: DiagnosisPlantContext) => void;
  compact?: boolean;
}

const getPlantName = (plant: PlantResponse) =>
  plant.nickName || plant.plantNumber || plant.tagCode || plant.id;

const toContext = (
  plant: PlantResponse | null,
  plot: FarmPlotResponse | null,
  zone: FarmZoneResponse | null,
): DiagnosisPlantContext => ({
  plantId: plant?.id,
  plantName: plant ? getPlantName(plant) : undefined,
  farmPlotId: plot?.id ?? plant?.farmPlotId,
  farmPlotName: plot?.name,
  farmZoneId: zone?.id,
  farmZoneName: zone?.zoneName,
});

export function DiagnosisPlantSelector({
  value,
  onChange,
  compact = false,
}: DiagnosisPlantSelectorProps) {
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(value.farmPlotId ?? "", !!value.farmPlotId);
  const plantsQuery = usePlants();

  const plots = useMemo(() => plotsQuery.data ?? [], [plotsQuery.data]);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const selectedPlot =
    plots.find((plot) => plot.id === value.farmPlotId) ?? null;
  const selectedZone =
    zones.find((zone) => zone.id === value.farmZoneId) ?? null;
  const filteredPlants = useMemo(
    () =>
      value.farmPlotId
        ? plants.filter((plant) => plant.farmPlotId === value.farmPlotId)
        : plants,
    [plants, value.farmPlotId],
  );

  useEffect(() => {
    if (!value.plantId || plants.length === 0) return;
    const plant = plants.find((item) => item.id === value.plantId);
    if (!plant) return;
    const plot = plots.find((item) => item.id === plant.farmPlotId) ?? null;
    if (
      value.plantName === getPlantName(plant) &&
      value.farmPlotId === plant.farmPlotId &&
      value.farmPlotName === plot?.name
    ) {
      return;
    }
    onChange({
      ...value,
      plantId: plant.id,
      plantName: getPlantName(plant),
      farmPlotId: plant.farmPlotId,
      farmPlotName: plot?.name ?? value.farmPlotName,
    });
  }, [onChange, plants, plots, value]);

  return (
    <section className={compact ? "" : "rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"}>
      {!compact && (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
            Thông tin cây liên quan
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-900">
            Gắn chẩn đoán với cây/vườn
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Không bắt buộc. Context này giúp AI tư vấn sát cây và khu vực hơn.
          </p>
        </div>
      )}

      <div className={`${compact ? "mt-2" : "mt-5"} grid grid-cols-1 gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Vườn
          </span>
          <Select
            value={value.farmPlotId ?? ""}
            onChange={(selectedId) => {
              const plot = plots.find((item) => item.id === String(selectedId)) ?? null;
              onChange({
                farmPlotId: plot?.id,
                farmPlotName: plot?.name,
              });
            }}
            options={[
              { value: "", label: "Không chọn vườn" },
              ...plots.map((plot) => ({ value: plot.id, label: plot.name })),
            ]}
            disabled={plotsQuery.isLoading}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Khu vực
          </span>
          <Select
            value={value.farmZoneId ?? ""}
            onChange={(selectedId) => {
              const zone = zones.find((item) => item.id === String(selectedId)) ?? null;
              onChange({
                ...value,
                farmZoneId: zone?.id,
                farmZoneName: zone?.zoneName,
              });
            }}
            options={[
              { value: "", label: value.farmPlotId ? "Không chọn khu vực" : "Chọn vườn trước" },
              ...zones.map((zone) => ({ value: zone.id, label: zone.zoneName })),
            ]}
            disabled={!value.farmPlotId || zonesQuery.isLoading}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Cây trồng
          </span>
          <Select
            value={value.plantId ?? ""}
            onChange={(selectedId) => {
              const plant =
                filteredPlants.find((item) => item.id === String(selectedId)) ??
                null;
              const plot =
                plots.find((item) => item.id === plant?.farmPlotId) ??
                selectedPlot;
              onChange(toContext(plant, plot, selectedZone));
            }}
            options={[
              { value: "", label: "Không chọn cây" },
              ...filteredPlants.map((plant) => ({ value: plant.id, label: getPlantName(plant) })),
            ]}
            disabled={plantsQuery.isLoading}
          />
        </label>
      </div>

      {(plotsQuery.isError || plantsQuery.isError || zonesQuery.isError) ? (
        <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Một phần dữ liệu cây/vườn/khu vực chưa tải được. Bạn vẫn có thể chẩn đoán ảnh bình thường.
        </p>
      ) : null}
    </section>
  );
}
