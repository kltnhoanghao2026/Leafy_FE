import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Layers3, Save, X } from "lucide-react";
import type {
  CreateFarmZoneRequest,
  FarmZoneResponse,
  UpdateFarmZoneRequest,
} from "../types";
import {
  buildCreateZonePayload,
  buildUpdateZonePayload,
  STATUS_LABELS,
  toZoneForm,
  ZONE_STATUS_OPTIONS,
} from "./formUtils";

interface FarmZoneFormDialogProps {
  mode: "create" | "edit";
  zone?: FarmZoneResponse | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateFarmZoneRequest | UpdateFarmZoneRequest,
  ) => Promise<void> | void;
}

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

export function FarmZoneFormDialog({
  mode,
  zone,
  isSubmitting = false,
  onClose,
  onSubmit,
}: FarmZoneFormDialogProps) {
  const [form, setForm] = useState(() => toZoneForm(zone));
  const title = mode === "create" ? "Thêm khu vực" : "Chỉnh sửa khu vực";
  const submitLabel = mode === "create" ? "Tạo khu vực" : "Lưu thay đổi";
  const dialogId =
    mode === "create" ? "create-farm-zone-title" : "edit-farm-zone-title";
  const canSubmit = form.zoneName.trim().length > 0 && !isSubmitting;

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const payload =
      mode === "create"
        ? buildCreateZonePayload(form)
        : buildUpdateZonePayload(form);
    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#245A34]">
              <Layers3 className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <h2 id={dialogId} className="text-xl font-black text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Chỉ nhập thông tin cần quản lý thường xuyên, các trường ít dùng
                nằm trong phần nâng cao.
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
              <Field label="Tên khu vực" htmlFor="zone-name">
                <input
                  id="zone-name"
                  required
                  value={form.zoneName}
                  onChange={(event) => updateForm({ zoneName: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
              <Field label="Diện tích (m²)" htmlFor="zone-area">
                <input
                  id="zone-area"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.areaM2}
                  onChange={(event) => updateForm({ areaM2: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
              <Field label="Loại đất" htmlFor="zone-soil">
                <input
                  id="zone-soil"
                  value={form.soilType}
                  onChange={(event) => updateForm({ soilType: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
              <Field label="Cây trồng" htmlFor="zone-crop">
                <input
                  id="zone-crop"
                  value={form.cropType}
                  onChange={(event) => updateForm({ cropType: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
              <Field label="Ngày trồng" htmlFor="zone-planting-date">
                <input
                  id="zone-planting-date"
                  type="date"
                  value={form.plantingDate}
                  onChange={(event) =>
                    updateForm({ plantingDate: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
            </div>

            <Field label="Mô tả" htmlFor="zone-description">
              <textarea
                id="zone-description"
                rows={3}
                value={form.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
              />
            </Field>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-700">
                Thông tin nâng cao
              </summary>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {mode === "edit" ? (
                  <Field label="Trạng thái" htmlFor="zone-status">
                    <select
                      id="zone-status"
                      value={form.status}
                      onChange={(event) =>
                        updateForm({ status: event.target.value as typeof form.status })
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                    >
                      {ZONE_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Mã khu vực" htmlFor="zone-code">
                  <input
                    id="zone-code"
                    value={form.zoneCode}
                    onChange={(event) => updateForm({ zoneCode: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Độ cao (m)" htmlFor="zone-elevation">
                  <input
                    id="zone-elevation"
                    type="number"
                    step="0.01"
                    value={form.elevationM}
                    onChange={(event) =>
                      updateForm({ elevationM: event.target.value })
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
