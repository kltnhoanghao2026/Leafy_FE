import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Leaf, Save, X } from "lucide-react";
import type { FarmPlotResponse } from "../../farm-management/types";
import type {
  PlantCreateRequest,
  PlantResponse,
  PlantStatus,
  PlantUpdateRequest,
} from "../types";
import {
  optionalNumber,
  optionalString,
  PLANT_STATUS_LABELS,
  toApiDateTime,
  toDateTimeInputValue,
} from "./displayUtils";
import { SpeciesSelect } from "./SpeciesSelect";

interface PlantFormDialogProps {
  mode: "create" | "edit";
  plant?: PlantResponse | null;
  farmPlots: FarmPlotResponse[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: PlantCreateRequest | PlantUpdateRequest,
  ) => Promise<void> | void;
}

interface PlantFormState {
  nickName: string;
  speciesId: string;
  farmPlotId: string;
  plantStatus: PlantStatus;
  tagCode: string;
  batchNumber: string;
  sourceType: string;
  plantingDate: string;
  germinationDate: string;
  actualHarvestDate: string;
  totalYieldKg: string;
}

const toFormState = (plant?: PlantResponse | null): PlantFormState => ({
  nickName: plant?.nickName ?? "",
  speciesId: plant?.speciesId ?? "",
  farmPlotId: plant?.farmPlotId ?? "",
  plantStatus: plant?.plantStatus ?? "ACTIVE",
  tagCode: plant?.tagCode ?? "",
  batchNumber: plant?.batchNumber ?? "",
  sourceType: plant?.sourceType ?? "",
  plantingDate: toDateTimeInputValue(plant?.plantingDate),
  germinationDate: toDateTimeInputValue(plant?.germinationDate),
  actualHarvestDate: toDateTimeInputValue(plant?.actualHarvestDate),
  totalYieldKg: plant?.totalYieldKg != null ? String(plant.totalYieldKg) : "",
});

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function PlantFormDialog({
  mode,
  plant,
  farmPlots,
  isSubmitting = false,
  onClose,
  onSubmit,
}: PlantFormDialogProps) {
  const [form, setForm] = useState(() => toFormState(plant));
  const title = mode === "create" ? "Thêm cây" : "Chỉnh sửa cây";
  const submitLabel = mode === "create" ? "Tạo cây" : "Lưu thay đổi";
  const dialogId =
    mode === "create" ? "create-plant-title" : "edit-plant-title";

  const canSubmit =
    form.nickName.trim().length > 0 &&
    form.speciesId.trim().length > 0 &&
    form.farmPlotId.trim().length > 0 &&
    !isSubmitting;

  const defaultFarmPlotName = useMemo(
    () =>
      farmPlots.find((plot) => plot.id === form.farmPlotId)?.name ??
      "Chưa chọn vườn",
    [farmPlots, form.farmPlotId],
  );

  const updateForm = (updates: Partial<PlantFormState>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const buildPayload = (): PlantCreateRequest | PlantUpdateRequest => {
    const payload = {
      plantStatus: form.plantStatus,
      nickName: optionalString(form.nickName),
      tagCode: optionalString(form.tagCode),
      batchNumber: optionalString(form.batchNumber),
      sourceType: optionalString(form.sourceType),
      plantingDate: toApiDateTime(form.plantingDate),
      germinationDate: toApiDateTime(form.germinationDate),
      actualHarvestDate: toApiDateTime(form.actualHarvestDate),
      totalYieldKg: optionalNumber(form.totalYieldKg),
      speciesId: form.speciesId,
      farmPlotId: form.farmPlotId,
    };

    return payload;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await onSubmit(buildPayload());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#245A34]">
              <Leaf className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 id={dialogId} className="text-xl font-black text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Chọn giống cây và vườn, các trường ít dùng nằm trong phần nâng
                cao. Vườn hiện chọn: {defaultFarmPlotName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên cây" htmlFor="plant-name">
                <input
                  id="plant-name"
                  required
                  value={form.nickName}
                  onChange={(event) => updateForm({ nickName: event.target.value })}
                  placeholder="Ví dụ: Cà phê lô A01"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>

              <Field label="Vườn" htmlFor="plant-farm-plot">
                <select
                  id="plant-farm-plot"
                  required
                  value={form.farmPlotId}
                  onChange={(event) =>
                    updateForm({ farmPlotId: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                >
                  <option value="">Chọn vườn</option>
                  {farmPlots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <SpeciesSelect
              required
              value={form.speciesId}
              onChange={(speciesId) => updateForm({ speciesId })}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Ngày trồng" htmlFor="planting-date">
                <input
                  id="planting-date"
                  type="datetime-local"
                  value={form.plantingDate}
                  onChange={(event) =>
                    updateForm({ plantingDate: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>

              {mode === "edit" ? (
                <Field label="Trạng thái" htmlFor="plant-status">
                  <select
                    id="plant-status"
                    value={form.plantStatus}
                    onChange={(event) =>
                      updateForm({
                        plantStatus: event.target.value as PlantStatus,
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  >
                    {Object.entries(PLANT_STATUS_LABELS).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-700">
                Thông tin nâng cao
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Mã tag" htmlFor="plant-tag-code">
                  <input
                    id="plant-tag-code"
                    value={form.tagCode}
                    onChange={(event) => updateForm({ tagCode: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Lô giống" htmlFor="plant-batch-number">
                  <input
                    id="plant-batch-number"
                    value={form.batchNumber}
                    onChange={(event) =>
                      updateForm({ batchNumber: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Nguồn cây" htmlFor="plant-source-type">
                  <input
                    id="plant-source-type"
                    value={form.sourceType}
                    onChange={(event) =>
                      updateForm({ sourceType: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Năng suất (kg)" htmlFor="plant-total-yield">
                  <input
                    id="plant-total-yield"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalYieldKg}
                    onChange={(event) =>
                      updateForm({ totalYieldKg: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Ngày nảy mầm" htmlFor="germination-date">
                  <input
                    id="germination-date"
                    type="datetime-local"
                    value={form.germinationDate}
                    onChange={(event) =>
                      updateForm({ germinationDate: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Ngày thu hoạch" htmlFor="actual-harvest-date">
                  <input
                    id="actual-harvest-date"
                    type="datetime-local"
                    value={form.actualHarvestDate}
                    onChange={(event) =>
                      updateForm({ actualHarvestDate: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
              </div>
            </details>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" strokeWidth={2.5} />
              {isSubmitting ? "Đang lưu..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
