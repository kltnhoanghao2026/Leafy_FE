import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { MapPin, Save } from "lucide-react";
import { ModalShell } from "../../../components/ui/ModalShell";
import type {
  CreateFarmPlotRequest,
  FarmPlotResponse,
  UpdateFarmPlotRequest,
} from "../types";
import type { AddressOption } from "../api/address.api";
import { AddressPicker } from "./AddressPicker";
import { buildAddressLineSuggestion } from "./addressUtils";
import {
  buildCreatePlotPayload,
  buildUpdatePlotPayload,
  PLOT_STATUS_OPTIONS,
  STATUS_LABELS,
  toPlotForm,
} from "./formUtils";

interface FarmPlotFormDialogProps {
  mode: "create" | "edit";
  ownerProfileId: string;
  plot?: FarmPlotResponse | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    payload: CreateFarmPlotRequest | UpdateFarmPlotRequest,
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

export function FarmPlotFormDialog({
  mode,
  ownerProfileId,
  plot,
  isSubmitting = false,
  onClose,
  onSubmit,
}: FarmPlotFormDialogProps) {
  const [form, setForm] = useState(() => toPlotForm(plot));
  const [addressTouched, setAddressTouched] = useState(Boolean(plot?.addressLine));
  const [addressNames, setAddressNames] = useState({
    provinceName: "",
    districtName: "",
    wardName: "",
  });

  const title = mode === "create" ? "Thêm vườn" : "Chỉnh sửa vườn";
  const submitLabel = mode === "create" ? "Tạo vườn" : "Lưu thay đổi";
  const dialogId =
    mode === "create" ? "create-farm-plot-title" : "edit-farm-plot-title";
  const canSubmit = form.name.trim().length > 0 && !isSubmitting;

  const suggestedAddress = useMemo(
    () =>
      buildAddressLineSuggestion({
        detail: addressTouched ? form.addressLine : "",
        ...addressNames,
      }),
    [addressNames, addressTouched, form.addressLine],
  );

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const refreshAddressLine = (nextNames: typeof addressNames) => {
    if (addressTouched) {
      return;
    }

    setForm((current) => ({
      ...current,
      addressLine: buildAddressLineSuggestion(nextNames),
    }));
  };

  const handleProvinceChange = (code: string, option: AddressOption | null) => {
    const nextNames = {
      provinceName: option?.name ?? "",
      districtName: "",
      wardName: "",
    };
    setAddressNames(nextNames);
    updateForm({ provinceCode: code, districtCode: "", wardCode: "" });
    refreshAddressLine(nextNames);
  };

  const handleDistrictChange = (code: string, option: AddressOption | null) => {
    const nextNames = {
      ...addressNames,
      districtName: option?.name ?? "",
      wardName: "",
    };
    setAddressNames(nextNames);
    updateForm({ districtCode: code, wardCode: "" });
    refreshAddressLine(nextNames);
  };

  const handleWardChange = (code: string, option: AddressOption | null) => {
    const nextNames = {
      ...addressNames,
      wardName: option?.name ?? "",
    };
    setAddressNames(nextNames);
    updateForm({ wardCode: code });
    refreshAddressLine(nextNames);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const payload =
      mode === "create"
        ? buildCreatePlotPayload(form, ownerProfileId)
        : buildUpdatePlotPayload(form);
    await onSubmit(payload);
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<MapPin className="h-5 w-5 text-[#245A34]" strokeWidth={2.5} />}
      iconBg="bg-[#EAF3EA]"
      title={title}
      titleId={dialogId}
      subtitle={
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Chọn địa chỉ theo tỉnh/huyện/xã, chỉ nhập thêm phần địa chỉ chi tiết khi cần.
        </p>
      }
      maxWidth="sm:max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tên vườn" htmlFor="plot-name">
                <input
                  id="plot-name"
                  required
                  value={form.name}
                  onChange={(event) => updateForm({ name: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
              <Field label="Diện tích (m²)" htmlFor="plot-area">
                <input
                  id="plot-area"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.areaM2}
                  onChange={(event) => updateForm({ areaM2: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                />
              </Field>
            </div>

            <AddressPicker
              provinceCode={form.provinceCode}
              districtCode={form.districtCode}
              wardCode={form.wardCode}
              addressLine={form.addressLine}
              onProvinceChange={handleProvinceChange}
              onDistrictChange={handleDistrictChange}
              onWardChange={handleWardChange}
              onAddressLineChange={(value) => {
                setAddressTouched(true);
                updateForm({ addressLine: value });
              }}
            />

            {!addressTouched && suggestedAddress ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                Gợi ý địa chỉ: {suggestedAddress}
              </p>
            ) : null}

            <Field label="Mô tả" htmlFor="plot-description">
              <textarea
                id="plot-description"
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
                  <Field label="Trạng thái" htmlFor="plot-status">
                    <select
                      id="plot-status"
                      value={form.status}
                      onChange={(event) =>
                        updateForm({ status: event.target.value as typeof form.status })
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                    >
                      {PLOT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
                <Field label="Mã tỉnh/thành" htmlFor="plot-province-code">
                  <input
                    id="plot-province-code"
                    value={form.provinceCode}
                    onChange={(event) => updateForm({ provinceCode: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Mã quận/huyện" htmlFor="plot-district-code">
                  <input
                    id="plot-district-code"
                    value={form.districtCode}
                    onChange={(event) => updateForm({ districtCode: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Mã phường/xã" htmlFor="plot-ward-code">
                  <input
                    id="plot-ward-code"
                    value={form.wardCode}
                    onChange={(event) => updateForm({ wardCode: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Latitude" htmlFor="plot-latitude">
                  <input
                    id="plot-latitude"
                    type="number"
                    step="0.000001"
                    value={form.latitude}
                    onChange={(event) => updateForm({ latitude: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
                  />
                </Field>
                <Field label="Longitude" htmlFor="plot-longitude">
                  <input
                    id="plot-longitude"
                    type="number"
                    step="0.000001"
                    value={form.longitude}
                    onChange={(event) => updateForm({ longitude: event.target.value })}
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
    </ModalShell>
  );
}
