import { useState, useMemo } from "react";
import {
  Play, CalendarDays, Layers, TreePine, LayoutGrid, Leaf,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, MinusCircle,
} from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { Select } from "../../../../components/ui/Select";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { usePlantsByFarmPlot } from "../..";
import type { BulkApplyCustomRequest, PlanApplyItemRequest, PlanResponse } from "../../shared/types";

// ── Per-plan row state ────────────────────────────────────────────────────────

interface PlanRowConfig {
  startDate: string;
  farmPlotId: string;
  farmZoneId: string;
  plantId: string;
  excludedPlantIds: string[];
  excludedFarmZoneIds: string[];
}

const defaultRowConfig = (): PlanRowConfig => ({
  startDate: "",
  farmPlotId: "",
  farmZoneId: "",
  plantId: "",
  excludedPlantIds: [],
  excludedFarmZoneIds: [],
});

// ── Sub-component: one plan's configuration row ───────────────────────────────

interface PlanRowProps {
  plan: PlanResponse;
  config: PlanRowConfig;
  onUpdate: (cfg: PlanRowConfig) => void;
  plotOptions: { value: string; label: string }[];
}

function PlanRow({ plan, config, onUpdate, plotOptions }: PlanRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [excludeOpen, setExcludeOpen] = useState(false);

  const zonesQuery  = useFarmZones(config.farmPlotId, !!config.farmPlotId);
  const plantsQuery = usePlantsByFarmPlot(config.farmPlotId, !!config.farmPlotId);

  const today = new Date().toISOString().slice(0, 10);

  const zones  = zonesQuery.data  ?? [];
  const plants = plantsQuery.data ?? [];

  const zoneOptions = [
    { value: "", label: "Tất cả khu vực" },
    ...zones.map((z) => ({ value: z.id, label: z.zoneName })),
  ];
  const plantOptions = [
    { value: "", label: "Tất cả cây trong vườn" },
    ...plants.map((p) => ({
      value: p.id,
      label: p.nickName ?? p.plantNumber ?? p.id,
    })),
  ];

  // Only show exclude section when scope is at plot level (not narrowed to a single zone/plant)
  const showExcludeZones  = !!config.farmPlotId && !config.farmZoneId && !config.plantId;
  const showExcludePlants = !!config.farmPlotId && !config.plantId;
  const showExcludeSection = showExcludeZones || showExcludePlants;
  const totalExcluded = config.excludedPlantIds.length + config.excludedFarmZoneIds.length;

  const toggleExcludePlant = (id: string) =>
    onUpdate({
      ...config,
      excludedPlantIds: config.excludedPlantIds.includes(id)
        ? config.excludedPlantIds.filter((x) => x !== id)
        : [...config.excludedPlantIds, id],
    });

  const toggleExcludeZone = (id: string) =>
    onUpdate({
      ...config,
      excludedFarmZoneIds: config.excludedFarmZoneIds.includes(id)
        ? config.excludedFarmZoneIds.filter((x) => x !== id)
        : [...config.excludedFarmZoneIds, id],
    });

  const isValid = !!config.startDate && (!!config.farmPlotId || !!config.plantId || !!config.farmZoneId);
  const planLabel = plan.planName || plan.diseaseName || plan.id;

  return (
    <div className={`rounded-2xl border transition-all ${isValid ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isValid ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
            {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{planLabel}</p>
            {isValid ? (
              <p className="text-[11px] font-semibold text-emerald-600">
                {config.startDate} · {config.plantId ? "Cây" : config.farmZoneId ? "Khu vực" : "Vườn"}
                {totalExcluded > 0 && ` · trừ ${totalExcluded} mục`}
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-slate-400">Chưa cấu hình</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
      </button>

      {/* Config panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Start date + Farm plot */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                <CalendarDays className="h-3 w-3" /> Ngày bắt đầu *
              </label>
              <DatePicker
                value={config.startDate}
                onChange={(v) => onUpdate({ ...config, startDate: v })}
                type="date"
                minDate={today}
                placeholder="Chọn ngày..."
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                <TreePine className="h-3 w-3" /> Vườn *
              </label>
              <Select
                value={config.farmPlotId}
                onChange={(v) =>
                  onUpdate({
                    ...config,
                    farmPlotId: String(v),
                    farmZoneId: "",
                    plantId: "",
                    excludedPlantIds: [],
                    excludedFarmZoneIds: [],
                  })
                }
                options={plotOptions}
                placeholder="Chọn vườn..."
              />
            </div>
          </div>

          {/* Farm zone + Specific plant */}
          {config.farmPlotId && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                  <LayoutGrid className="h-3 w-3" /> Khu vực
                </label>
                <Select
                  value={config.farmZoneId}
                  onChange={(v) =>
                    onUpdate({
                      ...config,
                      farmZoneId: String(v),
                      plantId: "",
                      excludedFarmZoneIds: [],
                    })
                  }
                  options={zoneOptions}
                  placeholder="Tất cả khu vực"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Leaf className="h-3 w-3" /> Cây cụ thể
                </label>
                <Select
                  value={config.plantId}
                  onChange={(v) =>
                    onUpdate({ ...config, plantId: String(v), excludedPlantIds: [] })
                  }
                  options={plantOptions}
                  placeholder="Tất cả cây trong vườn"
                />
              </div>
            </div>
          )}

          {/* No plot selected warning */}
          {!config.farmPlotId && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              Chọn ít nhất một vườn để áp dụng kế hoạch này.
            </div>
          )}

          {/* ── Exclude section ─────────────────────────────────────────────── */}
          {showExcludeSection && (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setExcludeOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <MinusCircle className="h-3.5 w-3.5 text-rose-400" />
                  Loại trừ
                  {totalExcluded > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-600">
                      {totalExcluded}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">tùy chọn</span>
                  )}
                </span>
                {excludeOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {excludeOpen && (
                <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  {/* Exclude zones */}
                  {showExcludeZones && zones.length > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <LayoutGrid className="h-3 w-3" /> Bỏ qua khu vực
                        </p>
                        {config.excludedFarmZoneIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onUpdate({ ...config, excludedFarmZoneIds: [] })}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                          >
                            Bỏ chọn tất cả
                          </button>
                        )}
                      </div>
                      <div className="flex max-h-40 flex-col gap-1 overflow-y-auto pr-0.5">
                        {zones.map((z) => {
                          const excluded = config.excludedFarmZoneIds.includes(z.id);
                          return (
                            <label
                              key={z.id}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all ${
                                excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={excluded}
                                onChange={() => toggleExcludeZone(z.id)}
                                className="h-3.5 w-3.5 rounded accent-rose-500"
                              />
                              <LayoutGrid className={`h-3 w-3 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                              <span className={`truncate text-xs font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>
                                {z.zoneName}
                              </span>
                              {excluded && <span className="ml-auto shrink-0 text-[10px] font-black text-rose-400">loại trừ</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Exclude plants */}
                  {showExcludePlants && plants.length > 0 && (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <Leaf className="h-3 w-3" /> Bỏ qua cây
                        </p>
                        {config.excludedPlantIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onUpdate({ ...config, excludedPlantIds: [] })}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-700"
                          >
                            Bỏ chọn tất cả
                          </button>
                        )}
                      </div>
                      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto pr-0.5">
                        {plants.map((pl) => {
                          const excluded = config.excludedPlantIds.includes(pl.id);
                          return (
                            <label
                              key={pl.id}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all ${
                                excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={excluded}
                                onChange={() => toggleExcludePlant(pl.id)}
                                className="h-3.5 w-3.5 rounded accent-rose-500"
                              />
                              <Leaf className={`h-3 w-3 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                              <span className={`truncate text-xs font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>
                                {pl.nickName ?? pl.plantNumber ?? pl.id}
                              </span>
                              {excluded && <span className="ml-auto shrink-0 text-[10px] font-black text-rose-400">loại trừ</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface BulkApplyCustomDialogProps {
  plans: PlanResponse[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: BulkApplyCustomRequest) => void;
}

export function BulkApplyCustomDialog({
  plans,
  isSubmitting,
  onClose,
  onSubmit,
}: BulkApplyCustomDialogProps) {
  const [configs, setConfigs] = useState<Record<string, PlanRowConfig>>(
    () => Object.fromEntries(plans.map((p) => [p.id, defaultRowConfig()])),
  );

  const profileQuery   = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery     = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const plotOptions    = useMemo(
    () => [
      { value: "", label: "Chọn vườn..." },
      ...(plotsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    ],
    [plotsQuery.data],
  );

  const updateConfig = (planId: string, cfg: PlanRowConfig) =>
    setConfigs((prev) => ({ ...prev, [planId]: cfg }));

  const readyCount = plans.filter((p) => {
    const c = configs[p.id];
    return !!c?.startDate && (!!c.farmPlotId || !!c.plantId || !!c.farmZoneId);
  }).length;

  const canSubmit = readyCount > 0;

  const handleSubmit = () => {
    const items: PlanApplyItemRequest[] = plans
      .map((p) => {
        const c = configs[p.id];
        if (!c?.startDate || (!c.farmPlotId && !c.plantId && !c.farmZoneId)) return null;

        return {
          planId:   p.id,
          startDate: c.startDate,
          // If a specific plant is chosen, plant scope wins; farm context is dropped
          plantId:     c.plantId || undefined,
          farmPlotId:  c.farmPlotId && !c.plantId ? c.farmPlotId  : undefined,
          farmZoneId:  c.farmZoneId && !c.plantId ? c.farmZoneId  : undefined,
          // Excludes only make sense when not targeting a single plant
          excludedPlantIds:    !c.plantId && c.excludedPlantIds.length    > 0 ? c.excludedPlantIds    : undefined,
          excludedFarmZoneIds: !c.plantId && c.excludedFarmZoneIds.length > 0 ? c.excludedFarmZoneIds : undefined,
        } satisfies PlanApplyItemRequest;
      })
      .filter(Boolean) as PlanApplyItemRequest[];

    onSubmit({ items });
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<Layers className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
      title="Áp dụng từng kế hoạch"
      titleId="bulk-apply-custom-title"
      subtitle={
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-[#245A34]/10 px-2 py-0.5 text-xs font-black text-[#245A34]">
            {plans.length} kế hoạch
          </span>
          <span className="text-sm font-medium text-slate-400">— cấu hình ngày, phạm vi và loại trừ riêng biệt</span>
        </div>
      }
      accentBar={<div className="h-1 w-full shrink-0 bg-linear-to-r from-[#245A34] to-emerald-400" />}
      position="bottom-sheet"
      maxWidth="sm:max-w-3xl"
      dragHandle
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#245A34] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1b4528] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" strokeWidth={2.5} />
            )}
            Áp dụng {readyCount} / {plans.length} kế hoạch
          </button>
        </>
      }
      footerClassName="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end"
    >
      <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Ready summary bar */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <div className={`h-2 w-2 rounded-full ${readyCount === plans.length ? "bg-emerald-500" : readyCount > 0 ? "bg-amber-400" : "bg-slate-300"}`} />
          <p className="text-xs font-semibold text-slate-600">
            {readyCount === 0
              ? "Chưa cấu hình kế hoạch nào. Đặt ngày và phạm vi cho ít nhất 1 kế hoạch."
              : readyCount === plans.length
              ? `Đã cấu hình xong ${readyCount} kế hoạch — sẵn sàng áp dụng.`
              : `${readyCount} / ${plans.length} kế hoạch đã cấu hình. Các kế hoạch chưa cấu hình sẽ bị bỏ qua.`}
          </p>
        </div>

        {/* Per-plan rows */}
        {plans.map((plan) => (
          <PlanRow
            key={plan.id}
            plan={plan}
            config={configs[plan.id] ?? defaultRowConfig()}
            onUpdate={(cfg) => updateConfig(plan.id, cfg)}
            plotOptions={plotOptions}
          />
        ))}
      </div>
    </ModalShell>
  );
}
