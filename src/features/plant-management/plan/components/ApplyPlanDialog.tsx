import { useState } from "react";
import {
  Play,
  ChevronDown,
  MinusCircle,
  CalendarDays,
  Layers,
  Leaf,
  LayoutGrid,
  TreePine,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { Select } from "../../../../components/ui/Select";
import { usePlantsByFarmPlot } from "../..";
import type { PlanApplyRequest, PlanResponse } from "../../shared/types";

interface ApplyPlanDialogProps {
  plan: PlanResponse;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: PlanApplyRequest) => void;
}

export function ApplyPlanDialog({
  plan,
  isSubmitting,
  onClose,
  onSubmit,
}: ApplyPlanDialogProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>("");
  const [farmPlotId, setFarmPlotId] = useState<string>("");
  const [farmZoneId, setFarmZoneId] = useState<string>("");
  const [plantId, setPlantId] = useState<string>("");
  const [excludedPlantIds, setExcludedPlantIds] = useState<string[]>([]);
  const [excludedFarmZoneIds, setExcludedFarmZoneIds] = useState<string[]>([]);
  const [excludeOpen, setExcludeOpen] = useState(false);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";

  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery = usePlantsByFarmPlot(farmPlotId, !!farmPlotId);

  const plotOptions = [
    { value: "", label: "Tất cả vườn" },
    ...(plotsQuery.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const zoneOptions = [
    { value: "", label: "Tất cả khu vực" },
    ...(zonesQuery.data ?? []).map((z) => ({
      value: z.id,
      label: z.zoneName,
    })),
  ];

  const plantOptions = [
    { value: "", label: "Tất cả cây trong vườn" },
    ...(plantsQuery.data ?? []).map((pl) => ({
      value: pl.id,
      label: pl.nickName ?? pl.plantNumber ?? pl.id,
    })),
  ];

  // Derived name lookups
  const selectedPlotName = plotsQuery.data?.find((p) => p.id === farmPlotId)?.name;
  const selectedZoneName = zonesQuery.data?.find((z) => z.id === farmZoneId)?.zoneName;
  const selectedPlantLabel = plantsQuery.data?.find((p) => p.id === plantId)
    ? (plantsQuery.data!.find((p) => p.id === plantId)!.nickName ??
       plantsQuery.data!.find((p) => p.id === plantId)!.plantNumber ??
       plantId)
    : null;

  // Scope summary chip
  const scopeSummary = plantId
    ? { icon: <Leaf className="h-3.5 w-3.5" />, text: selectedPlantLabel ?? "Cây đã chọn", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
    : farmZoneId
      ? { icon: <LayoutGrid className="h-3.5 w-3.5" />, text: selectedZoneName ?? "Khu vực đã chọn", color: "text-blue-700 bg-blue-50 border-blue-200" }
      : farmPlotId
        ? { icon: <TreePine className="h-3.5 w-3.5" />, text: selectedPlotName ?? "Vườn đã chọn", color: "text-violet-700 bg-violet-50 border-violet-200" }
        : null;

  // Exclude section visibility
  const showExcludeZones = !!farmPlotId && !farmZoneId && !plantId;
  const showExcludePlants = !!farmPlotId && !plantId;
  const showExcludeSection = showExcludeZones || showExcludePlants;
  const totalExcluded = excludedPlantIds.length + excludedFarmZoneIds.length;

  const canSubmit = !!startDate && (!!plantId || !!farmPlotId || !!farmZoneId);

  const toggleExcludePlant = (id: string) =>
    setExcludedPlantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleExcludeZone = (id: string) =>
    setExcludedFarmZoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    let targetName = "";
    if (plantId) targetName = selectedPlantLabel ?? "";
    else if (farmZoneId) targetName = selectedZoneName ?? "";
    else if (farmPlotId) targetName = selectedPlotName ?? "";

    const payload: PlanApplyRequest = {
      startDate,
      ...(plantId ? { plantId } : {}),
      ...(farmPlotId && !plantId ? { farmPlotId } : {}),
      ...(farmZoneId && !plantId ? { farmZoneId } : {}),
      ...(excludedPlantIds.length > 0 ? { excludedPlantIds } : {}),
      ...(excludedFarmZoneIds.length > 0 ? { excludedFarmZoneIds } : {}),
      ...(targetName ? { targetName } : {}),
    };
    onSubmit(payload);
  };

  const handlePlotChange = (value: string | number) => {
    setFarmPlotId(String(value));
    setFarmZoneId("");
    setPlantId("");
    setExcludedPlantIds([]);
    setExcludedFarmZoneIds([]);
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<Play className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
      title="Áp dụng kế hoạch"
      titleId="apply-plan-title"
      subtitle={
        <p className="mt-0.5 text-sm font-medium text-slate-400">
          {plan.diseaseName ?? plan.planName ?? plan.id}
        </p>
      }
      accentBar={
        <div className="h-1 w-full shrink-0 bg-linear-to-r from-[#245A34] to-emerald-400" />
      }
      position="bottom-sheet"
      maxWidth="sm:max-w-4xl"
      dragHandle
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#245A34] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1b4528] active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang áp dụng...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" strokeWidth={2.5} />
                Áp dụng
              </>
            )}
          </button>
        </>
      }
      footerClassName="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end"
    >
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

            {/* Left column: Date + Status summary */}
            <div className="px-6 py-5 space-y-5">

              {/* Date picker */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-black text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Ngày bắt đầu <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                  minDate={today}
                  placeholder="Chọn ngày bắt đầu..."
                />
              </div>

              {/* Live scope status */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-slate-700">
                  <Layers className="h-4 w-4 text-slate-400" />
                  Trạng thái phạm vi
                </p>
                {scopeSummary ? (
                  <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${scopeSummary.color}`}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black">
                        {plantId ? "Áp dụng cho cây" : farmZoneId ? "Áp dụng cho khu vực" : "Áp dụng cho toàn vườn"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                        {scopeSummary.icon}
                        {scopeSummary.text}
                      </p>
                      {totalExcluded > 0 && (
                        <p className="mt-1 text-[11px] font-semibold opacity-70">trừ {totalExcluded} mục bị loại trừ</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-700">Chưa chọn phạm vi</p>
                      <p className="mt-0.5 text-xs font-semibold text-amber-600">Chọn vườn để xác định phạm vi áp dụng kế hoạch.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Hint when scope missing */}
              {startDate && !canSubmit && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                  Chọn ít nhất một phạm vi (vườn, khu vực hoặc cây) để tiếp tục.
                </div>
              )}
            </div>

            {/* Right column: Scope selectors + Exclude */}
            <div className="px-6 py-5 space-y-5">

              {/* Scope selectors */}
              <div>
                <p className="mb-2.5 flex items-center gap-1.5 text-sm font-black text-slate-700">
                  <Layers className="h-4 w-4 text-slate-400" />
                  Phạm vi áp dụng
                  <span className="text-xs font-semibold text-slate-400">(chọn ít nhất một)</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <TreePine className="h-3 w-3" />
                      Vườn
                    </label>
                    <Select
                      value={farmPlotId}
                      onChange={handlePlotChange}
                      options={plotOptions}
                      placeholder="Chọn vườn..."
                    />
                  </div>

                  {farmPlotId && (
                    <>
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <LayoutGrid className="h-3 w-3" />
                          Khu vực
                        </label>
                        <Select
                          value={farmZoneId}
                          onChange={(v) => {
                            setFarmZoneId(String(v));
                            setPlantId("");
                            setExcludedFarmZoneIds([]);
                          }}
                          options={zoneOptions}
                          placeholder="Chọn khu vực..."
                        />
                      </div>

                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <Leaf className="h-3 w-3" />
                          Cây cụ thể
                        </label>
                        <Select
                          value={plantId}
                          onChange={(v) => {
                            setPlantId(String(v));
                            setExcludedPlantIds([]);
                          }}
                          options={plantOptions}
                          placeholder="Chọn cây..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Exclude section */}
              {showExcludeSection && (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setExcludeOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <MinusCircle className="h-4 w-4 text-rose-400" />
                      Loại trừ
                      {totalExcluded > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-600">
                          {totalExcluded}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">tùy chọn</span>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${excludeOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {excludeOpen && (
                    <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 px-4 py-3">

                      {showExcludeZones && (zonesQuery.data ?? []).length > 0 && (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                              <LayoutGrid className="h-3 w-3" />
                              Bỏ qua khu vực
                            </p>
                            {excludedFarmZoneIds.length > 0 && (
                              <button type="button" onClick={() => setExcludedFarmZoneIds([])} className="text-[11px] font-bold text-rose-500 hover:text-rose-700">
                                Bỏ chọn tất cả
                              </button>
                            )}
                          </div>
                          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-0.5">
                            {(zonesQuery.data ?? []).map((z) => {
                              const excluded = excludedFarmZoneIds.includes(z.id);
                              return (
                                <label key={z.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                                  excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                                }`}>
                                  <input type="checkbox" checked={excluded} onChange={() => toggleExcludeZone(z.id)} className="h-4 w-4 rounded accent-rose-500" />
                                  <LayoutGrid className={`h-3.5 w-3.5 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                                  <span className={`truncate text-sm font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>{z.zoneName}</span>
                                  {excluded && <span className="ml-auto shrink-0 text-[10px] font-black text-rose-400">loại trừ</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {showExcludePlants && (plantsQuery.data ?? []).length > 0 && (
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                              <Leaf className="h-3 w-3" />
                              Bỏ qua cây
                            </p>
                            {excludedPlantIds.length > 0 && (
                              <button type="button" onClick={() => setExcludedPlantIds([])} className="text-[11px] font-bold text-rose-500 hover:text-rose-700">
                                Bỏ chọn tất cả
                              </button>
                            )}
                          </div>
                          <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-0.5">
                            {(plantsQuery.data ?? []).map((pl) => {
                              const excluded = excludedPlantIds.includes(pl.id);
                              return (
                                <label key={pl.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                                  excluded ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white hover:border-slate-300"
                                }`}>
                                  <input type="checkbox" checked={excluded} onChange={() => toggleExcludePlant(pl.id)} className="h-4 w-4 rounded accent-rose-500" />
                                  <Leaf className={`h-3.5 w-3.5 shrink-0 ${excluded ? "text-rose-400" : "text-slate-300"}`} />
                                  <span className={`truncate text-sm font-semibold ${excluded ? "text-rose-700 line-through" : "text-slate-700"}`}>
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
          </div>

    </ModalShell>
  );
}
