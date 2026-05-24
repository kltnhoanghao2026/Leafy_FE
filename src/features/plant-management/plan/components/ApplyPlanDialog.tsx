import { useState } from "react";
import {
  Play,
  CalendarDays,
  Layers,
  CheckCircle2,
  AlertCircle,
  TreePine,
  LayoutGrid,
  Leaf,
  AlertTriangle,
  Package,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { useFarmPlots, useFarmZones } from "../../../farm-management/queries";
import { useMyProfile } from "../../../settings/queries";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { useMyPlants } from "../..";
import { unwrapPageContent } from "../../shared/api/apiUtils";
import type { PlanApplyRequest, PlanResponse } from "../../shared/types";
import { useScopeSummary } from "../shared/utils/scopeUtils";
import { EntitySelectModal } from "./EntitySelectModal";
import { ExcludeSection } from "./ExcludeSection";
import type { ApplyPlanDialogProps } from "../schemas/apply-dialog.schema";
import type { FarmPlotResponse } from "../../../farm-management/types";
import type { FarmZoneResponse } from "../../../farm-management/types";
import type { PlantResponse } from "../../shared/types";

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  MEDIUM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export function ApplyPlanDialog({
  plan,
  isSubmitting,
  onClose,
  onSubmit,
}: ApplyPlanDialogProps) {
  const today = new Date().toISOString().slice(0, 10);

  // State
  const [startDate, setStartDate] = useState<string>("");
  const [farmPlotId, setFarmPlotId] = useState<string>("");
  const [farmZoneId, setFarmZoneId] = useState<string>("");
  const [plantId, setPlantId] = useState<string>("");
  const [excludedPlantIds, setExcludedPlantIds] = useState<string[]>([]);
  const [excludedFarmZoneIds, setExcludedFarmZoneIds] = useState<string[]>([]);
  const [excludeOpen, setExcludeOpen] = useState(false);

  // Modal state
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [plantModalOpen, setPlantModalOpen] = useState(false);

  // Queries
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";

  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZones(farmPlotId, !!farmPlotId);
  const plantsQuery = useMyPlants(
    {
      farmPlotId: farmPlotId || undefined,
      farmZoneId: farmZoneId || undefined,
    },
    !!farmPlotId,
  );

  // Data
  const plants = unwrapPageContent(plantsQuery.data);
  const zones = zonesQuery.data ?? [];

  // Derived names
  const selectedPlotName = plotsQuery.data?.find((p) => p.id === farmPlotId)?.name;
  const selectedZoneName = zonesQuery.data?.find((z) => z.id === farmZoneId)?.zoneName;
  const selectedPlantLabel = plants.find((p) => p.id === plantId)
    ? (plants.find((p) => p.id === plantId)!.nickName ??
       plants.find((p) => p.id === plantId)!.plantNumber ??
       plantId)
    : null;

  // Scope summary
  const scopeSummary = useScopeSummary(plantId, farmZoneId, farmPlotId, {
    plotName: selectedPlotName,
    zoneName: selectedZoneName,
    plantLabel: selectedPlantLabel,
  });

  // Exclude section visibility
  const showExcludeZones = !!farmPlotId && !farmZoneId && !plantId;
  const showExcludePlants = !!farmPlotId && !plantId;
  const showExcludeSection = showExcludeZones || showExcludePlants;
  const totalExcluded = excludedPlantIds.length + excludedFarmZoneIds.length;

  // Excluded names for display
  const excludedZoneNames = zones
    .filter((z) => excludedFarmZoneIds.includes(z.id))
    .map((z) => z.zoneName);
  const excludedPlantNames = plants
    .filter((p) => excludedPlantIds.includes(p.id))
    .map((p) => p.nickName ?? p.plantNumber ?? p.id);

  // Handlers
  const toggleExcludePlant = (id: string) =>
    setExcludedPlantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleExcludeZone = (id: string) =>
    setExcludedFarmZoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handlePlotSelect = (id: string) => {
    setFarmPlotId(id);
    setFarmZoneId("");
    setPlantId("");
    setExcludedPlantIds([]);
    setExcludedFarmZoneIds([]);
  };

  const handleZoneSelect = (id: string) => {
    setFarmZoneId(id);
    setPlantId("");
    setExcludedFarmZoneIds([]);
  };

  const handlePlantSelect = (id: string) => {
    setPlantId(id);
    setExcludedPlantIds([]);
  };

  const canSubmit = !!startDate;

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

  const severityStyle = SEVERITY_COLORS[plan.severityLevel ?? ""] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

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
      {/* Plan info section */}
      <div className="px-6 py-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity badge */}
          {plan.severityLevel && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}>
              <AlertTriangle className="h-3 w-3" />
              {plan.severityLevel}
            </span>
          )}
          {/* Disease name */}
          {plan.diseaseName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-semibold text-red-700">
              <Target className="h-3 w-3" />
              {plan.diseaseName}
            </span>
          )}
          {/* Estimated cost */}
          {plan.estimatedCost && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <TrendingUp className="h-3 w-3" />
              {plan.estimatedCost}
            </span>
          )}
        </div>

        {/* Required inputs */}
        {plan.requiredInputs && plan.requiredInputs.length > 0 && (
          <div className="flex flex-wrap items-start gap-2">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <Package className="h-3 w-3" />
              Vật tư cần thiết
            </span>
            <div className="flex flex-wrap gap-1">
              {plan.requiredInputs.slice(0, 3).map((input, idx) => (
                <span key={idx} className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {input}
                </span>
              ))}
              {plan.requiredInputs.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  +{plan.requiredInputs.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Safety warnings */}
        {plan.safetyWarnings && plan.safetyWarnings.length > 0 && (
          <div className="flex flex-wrap items-start gap-2">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              Cảnh báo an toàn
            </span>
            <div className="flex flex-wrap gap-1">
              {plan.safetyWarnings.slice(0, 2).map((warning, idx) => (
                <span key={idx} className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {warning}
                </span>
              ))}
              {plan.safetyWarnings.length > 2 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  +{plan.safetyWarnings.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

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
              <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${scopeSummary.color} ${scopeSummary.bg} border-${scopeSummary.border}`}>
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black">
                    {scopeSummary.type === "all" ? "Áp dụng cho tất cả" : plantId ? "Áp dụng cho cây" : farmZoneId ? "Áp dụng cho khu vực" : "Áp dụng cho toàn vườn"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
                    {scopeSummary.icon}
                    {scopeSummary.text}
                  </p>
                  {totalExcluded > 0 && (
                    <p className="mt-1 text-[11px] font-semibold opacity-70">
                      trừ {excludedFarmZoneIds.length > 0 && `${excludedFarmZoneIds.length} khu vực`}
                      {excludedFarmZoneIds.length > 0 && excludedPlantIds.length > 0 && " và "}
                      {excludedPlantIds.length > 0 && `${excludedPlantIds.length} cây`}
                    </p>
                  )}
                  {totalExcluded > 0 && (excludedZoneNames.length > 0 || excludedPlantNames.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {excludedZoneNames.map((name) => (
                        <span key={name} className="inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                          {name}
                        </span>
                      ))}
                      {excludedPlantNames.map((name) => (
                        <span key={name} className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                          {name}
                        </span>
                      ))}
                    </div>
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
        </div>

        {/* Right column: Scope selectors + Exclude */}
        <div className="px-6 py-5 space-y-5">

          {/* Plot selector */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <TreePine className="h-3 w-3" />
              Vườn
            </label>
            <button
              type="button"
              onClick={() => setPlotModalOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              <span className={farmPlotId ? "text-slate-900" : "text-slate-400"}>
                {selectedPlotName || "Chọn vườn..."}
              </span>
              <TreePine className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Zone selector */}
          {farmPlotId && (
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <LayoutGrid className="h-3 w-3" />
                Khu vực
              </label>
              <button
                type="button"
                onClick={() => setZoneModalOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
              >
                <span className={farmZoneId ? "text-slate-900" : "text-slate-400"}>
                  {selectedZoneName || "Chọn khu vực..."}
                </span>
                <LayoutGrid className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Plant selector */}
          {farmPlotId && (
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <Leaf className="h-3 w-3" />
                Cây cụ thể
              </label>
              <button
                type="button"
                onClick={() => setPlantModalOpen(true)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
              >
                <span className={plantId ? "text-slate-900" : "text-slate-400"}>
                  {selectedPlantLabel || "Chọn cây..."}
                </span>
                <Leaf className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Exclude section */}
          {showExcludeSection && (
            <ExcludeSection
              zones={zones}
              plants={plants}
              excludedZoneIds={excludedFarmZoneIds}
              excludedPlantIds={excludedPlantIds}
              onToggleZone={toggleExcludeZone}
              onTogglePlant={toggleExcludePlant}
              onClearZones={() => setExcludedFarmZoneIds([])}
              onClearPlants={() => setExcludedPlantIds([])}
              showZones={showExcludeZones}
              showPlants={showExcludePlants}
              isOpen={excludeOpen}
              onToggle={() => setExcludeOpen((o) => !o)}
              totalExcluded={totalExcluded}
            />
          )}
        </div>
      </div>

      {/* Farm Plot Selection Modal */}
      <EntitySelectModal<FarmPlotResponse>
        isOpen={plotModalOpen}
        onClose={() => setPlotModalOpen(false)}
        selectedId={farmPlotId}
        onSelect={handlePlotSelect}
        items={plotsQuery.data ?? []}
        isLoading={plotsQuery.isLoading}
        title="Chọn vườn"
        icon={<TreePine className="h-5 w-5 text-[#245A34]" />}
        getItemId={(p) => p.id}
        getItemLabel={(p) => p.name || "—"}
        getItemCode={(p) => p.code}
        getItemSubtitle={(p) => p.addressLine}
        emptyMessage="Không tìm thấy vườn phù hợp"
        allOptionLabel="Tất cả vườn"
      />

      {/* Farm Zone Selection Modal */}
      <EntitySelectModal<FarmZoneResponse>
        isOpen={zoneModalOpen}
        onClose={() => setZoneModalOpen(false)}
        selectedId={farmZoneId}
        onSelect={handleZoneSelect}
        items={zones}
        isLoading={zonesQuery.isLoading}
        title="Chọn khu vực"
        icon={<LayoutGrid className="h-5 w-5 text-[#245A34]" />}
        getItemId={(z) => z.id}
        getItemLabel={(z) => z.zoneName || "—"}
        getItemCode={(z) => z.zoneCode}
        getItemSubtitle={(z) => z.description}
        emptyMessage="Không tìm thấy khu vực phù hợp"
        allOptionLabel="Tất cả khu vực"
      />

      {/* Plant Selection Modal */}
      <EntitySelectModal<PlantResponse & { id: string }>
        isOpen={plantModalOpen}
        onClose={() => setPlantModalOpen(false)}
        selectedId={plantId}
        onSelect={handlePlantSelect}
        items={plants}
        isLoading={plantsQuery.isLoading}
        title="Chọn cây"
        icon={<Leaf className="h-5 w-5 text-[#245A34]" />}
        getItemId={(p) => p.id}
        getItemLabel={(p) => p.nickName || p.plantNumber || "—"}
        getItemCode={(p) => p.plantNumber || p.tagCode}
        getItemSubtitle={(p) => p.speciesId}
        emptyMessage="Không tìm thấy cây phù hợp"
        allOptionLabel="Tất cả cây"
      />

    </ModalShell>
  );
}
