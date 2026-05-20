import { useState } from "react";
import type { EventTaskRequest, PlantEventCreateRequest, PlantEventType } from "../../shared/types";
import { EVENT_TYPE_LABELS } from "../../shared/components/displayUtils";
import { Select } from "../../../../components/ui/Select";
import { DatePicker } from "../../../../components/ui/DatePicker";
import { ImagePicker } from "../../../../components/ui/ImagePicker";
import { ModalShell } from "../../../../components/ui/ModalShell";
import { useFarmPlots, useFarmZonesByOwner } from "../../../farm-management/queries";
import { usePlants } from "../..";
import { useMyProfile } from "../../../settings/queries";
import { EventTaskEditor } from "./EventTaskEditor";
import { ScopeSelector } from "./ScopeSelector";
import { ALL_EVENT_TYPES } from "../schemas/eventConstants";

type ScopeType = 'FARM' | 'FARM_ZONE' | 'PLANT';

function parseOptionalNumber(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} phải là số không âm.`);
  }
  return parsed;
}

interface PlantEventCreateDialogProps {
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: PlantEventCreateRequest) => void;
}

export function PlantEventCreateDialog({
  isSubmitting = false,
  onClose,
  onSubmit,
}: PlantEventCreateDialogProps): React.ReactElement {
  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const zonesQuery = useFarmZonesByOwner(ownerProfileId, !!ownerProfileId);
  const plantsQuery = usePlants();

  const [scopeType, setScopeType] = useState<ScopeType>("FARM_ZONE");
  const [farmPlotId, setFarmPlotId] = useState("");
  const [farmZoneId, setFarmZoneId] = useState("");
  const [plantId, setPlantId] = useState("");
  const [eventType, setEventType] = useState<PlantEventType | "">("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [calculatedStartDate, setCalculatedStartDate] = useState("");
  const [calculatedEndDate, setCalculatedEndDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [phiDays, setPhiDays] = useState("");
  const [ppeRequired, setPpeRequired] = useState("");
  const [mrlNote, setMrlNote] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [planned, setPlanned] = useState(true);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<EventTaskRequest[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    setValidationError(null);

    if (!eventType) {
      setValidationError("Vui lòng chọn loại sự kiện.");
      return;
    }
    if (!note.trim()) {
      setValidationError("Vui lòng nhập tiêu đề/note cho lịch chăm sóc.");
      return;
    }

    if (calculatedStartDate && calculatedEndDate && calculatedEndDate < calculatedStartDate) {
      setValidationError("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.");
      return;
    }

    let parsedDurationDays: number | undefined;
    let parsedPhiDays: number | undefined;
    try {
      parsedDurationDays = parseOptionalNumber(durationDays, "Số ngày kéo dài");
      parsedPhiDays = parseOptionalNumber(phiDays, "PHI days");
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Trường số không hợp lệ.");
      return;
    }

    const payload: PlantEventCreateRequest = {
      eventType,
      note: note.trim(),
      description: description.trim() || undefined,
      targetType: scopeType,
      farmPlotId: farmPlotId || undefined,
      farmZoneId: farmZoneId || undefined,
      plantId: plantId || undefined,
      calculatedStartDate: calculatedStartDate || undefined,
      calculatedEndDate: calculatedEndDate || undefined,
      durationDays: parsedDurationDays,
      phiDays: parsedPhiDays,
      ppeRequired: ppeRequired.trim() || undefined,
      mrlNote: mrlNote.trim() || undefined,
      estimatedCost: estimatedCost.trim() || undefined,
      isPlanned: planned,
      tasks: tasks.map((task, i) => ({ ...task, order: i })),
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
    };

    onSubmit(payload);
  };

  return (
    <ModalShell
      onClose={onClose}
      title="Tạo lịch chăm sóc mới"
      subtitle={
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34] mt-0.5">
          Plant event
        </p>
      }
      maxWidth="sm:max-w-2xl"
      zIndex="z-70"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang tạo..." : "Tạo lịch"}
          </button>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-5">
        {validationError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {validationError}
          </div>
        )}

        {/* Scope selector */}
        <ScopeSelector
          scopeType={scopeType}
          onScopeTypeChange={setScopeType}
          farmPlotId={farmPlotId}
          onFarmPlotChange={setFarmPlotId}
          farmZoneId={farmZoneId}
          onFarmZoneChange={setFarmZoneId}
          plantId={plantId}
          onPlantIdChange={setPlantId}
          plotsData={plotsQuery.data ?? []}
          zonesData={zonesQuery.data ?? []}
          plantsData={plantsQuery.data ?? []}
          plotsLoading={plotsQuery.isLoading}
          zonesLoading={zonesQuery.isLoading}
          plantsLoading={plantsQuery.isLoading}
        />

        {/* Event type + Planned toggle */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Loại sự kiện
            </span>
            <Select
              className="mt-2"
              value={eventType}
              onChange={v => setEventType(v as PlantEventType)}
              options={[
                { value: '', label: '— Chọn loại sự kiện —' },
                ...ALL_EVENT_TYPES.map(type => ({
                  value: type,
                  label: EVENT_TYPE_LABELS[type] ?? type,
                })),
              ]}
            />
          </div>
          <div className="flex items-center rounded-2xl bg-slate-50 px-4">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={planned}
                onChange={e => setPlanned(e.target.checked)}
              />
              Đã lên lịch
            </label>
          </div>
        </div>

        {/* Note */}
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Tiêu đề/note <span className="text-red-400">*</span>
          </span>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            placeholder="VD: Tưới nước buổi sáng, Bón phân NPK..."
          />
        </div>

        {/* Description */}
        <div>
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Mô tả
          </span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
            placeholder="Mô tả chi tiết (tuỳ chọn)..."
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Ngày bắt đầu
            </span>
            <DatePicker
              className="mt-2"
              value={calculatedStartDate}
              onChange={setCalculatedStartDate}
              placeholder="Chọn ngày bắt đầu..."
            />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Ngày kết thúc
            </span>
            <DatePicker
              className="mt-2"
              value={calculatedEndDate}
              onChange={setCalculatedEndDate}
              placeholder="Chọn ngày kết thúc..."
            />
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-sm font-black text-[#245A34]"
        >
          {showAdvanced ? "Ẩn thông tin an toàn/nâng cao" : "Thông tin an toàn/nâng cao"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Số ngày kéo dài
              </span>
              <input
                value={durationDays}
                onChange={e => setDurationDays(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PHI days
              </span>
              <input
                value={phiDays}
                onChange={e => setPhiDays(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                PPE required
              </span>
              <input
                value={ppeRequired}
                onChange={e => setPpeRequired(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                MRL note
              </span>
              <input
                value={mrlNote}
                onChange={e => setMrlNote(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                Chi phí dự kiến
              </span>
              <input
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <ImagePicker
                label={`Tệp đính kèm (${attachmentIds.length})`}
                hint="Tải lên ảnh hoặc video cho sự kiện. Tối đa 8 tệp."
                value={attachmentIds}
                onChange={setAttachmentIds}
                max={8}
              />
            </div>
          </div>
        )}

        {/* Tasks */}
        <EventTaskEditor tasks={tasks} onChange={setTasks} />
      </div>
    </ModalShell>
  );
}
