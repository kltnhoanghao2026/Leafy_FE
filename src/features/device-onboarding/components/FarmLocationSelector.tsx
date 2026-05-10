import { useMemo } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { useMyProfile } from "../../settings/queries";
import type { FarmPlotResponse, FarmZoneResponse } from "../../farm-management/types";
import { useTranslation } from "../../../i18n";

interface FarmLocationSelectorProps {
  farmPlotId: string;
  zoneId: string;
  onFarmPlotChange: (farmPlotId: string, plot: FarmPlotResponse | null) => void;
  onZoneChange: (zoneId: string, zone: FarmZoneResponse | null) => void;
}

export function FarmLocationSelector({
  farmPlotId,
  zoneId,
  onFarmPlotChange,
  onZoneChange,
}: FarmLocationSelectorProps) {
  const { t } = useTranslation();
  const profileQuery = useMyProfile();
  const emptyLabel = t("iot.devices.location.empty");
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const plots = useMemo(() => plotsQuery.data ?? [], [plotsQuery.data]);
  const selectedPlot = useMemo(
    () => plots.find((plot) => plot.id === farmPlotId) ?? null,
    [farmPlotId, plots],
  );

  const zonesQuery = useFarmZones(farmPlotId, !!farmPlotId);
  const zones = useMemo(() => zonesQuery.data ?? [], [zonesQuery.data]);
  const selectedZone = useMemo(
    () => zones.find((zone) => zone.id === zoneId) ?? null,
    [zoneId, zones],
  );

  if (profileQuery.isLoading) {
    return (
      <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-[#245A34]" />
          {t("iot.devices.location.loadingProfile")}
        </div>
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="rounded-[1.75rem] border border-red-100 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-black text-red-700">
                {t("iot.devices.location.profileError")}
              </p>
              <p className="mt-1 text-sm font-semibold text-red-600">
                {t("iot.devices.location.profileErrorDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void profileQuery.refetch()}
              className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {t("iot.devices.location.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plotsQuery.isError ? (
        <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            {t("iot.devices.location.plotsError")}
          </p>
          <button
            type="button"
            onClick={() => void plotsQuery.refetch()}
            className="mt-3 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={2.5} />
            {t("iot.devices.location.reload")}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="block" htmlFor="farm-plot-select">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.location.farmPlot")}
          </span>
          <select
            id="farm-plot-select"
            value={farmPlotId}
            onChange={(event) => {
              const nextPlotId = event.target.value;
              const nextPlot = plots.find((plot) => plot.id === nextPlotId) ?? null;
              onFarmPlotChange(nextPlotId, nextPlot);
              onZoneChange("", null);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10 disabled:bg-slate-50"
            disabled={plotsQuery.isLoading || plots.length === 0}
          >
            <option value="">
              {plotsQuery.isLoading
                ? t("iot.devices.location.loadingFarmPlots")
                : t("iot.devices.location.farmPlot")}
            </option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
          {plotsQuery.isLoading ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t("iot.devices.location.loadingFarmPlotsHelp")}
            </p>
          ) : !plotsQuery.isError && plots.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t("iot.devices.location.noFarmPlots")}
            </p>
          ) : null}
        </label>

        <label className="block" htmlFor="zone-select">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("iot.devices.location.zone")}
          </span>
          <select
            id="zone-select"
            value={zoneId}
            onChange={(event) => {
              const nextZoneId = event.target.value;
              const nextZone = zones.find((zone) => zone.id === nextZoneId) ?? null;
              onZoneChange(nextZoneId, nextZone);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10 disabled:bg-slate-50"
            disabled={!farmPlotId || zonesQuery.isLoading || zones.length === 0}
          >
            <option value="">
              {!farmPlotId
                ? t("iot.devices.location.chooseFarmFirst")
                : zonesQuery.isLoading
                  ? t("iot.devices.location.loadingZones")
                  : t("iot.devices.location.zone")}
            </option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.zoneName}
              </option>
            ))}
          </select>
          {farmPlotId && zonesQuery.isLoading ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t("iot.devices.location.loadingZonesHelp")}
            </p>
          ) : farmPlotId && !zonesQuery.isError && zones.length === 0 ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {t("iot.devices.location.noZones")}
            </p>
          ) : null}
        </label>
      </div>

      {zonesQuery.isError ? (
        <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-700">
            {t("iot.devices.location.zonesError")}
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-600">
            {t("iot.devices.location.zonesErrorDescription")}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {t("iot.devices.location.selectedFarm")}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {selectedPlot?.name || emptyLabel}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {t("iot.devices.location.selectedZone")}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {selectedZone?.zoneName || emptyLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
