import { useState, useEffect } from "react";
import { X, Save, Loader2, PlusCircle, Trash2, Edit2 } from "lucide-react";
import type { PlanResponse, PlanUpdateRequest } from "../../shared/types";

interface EditPlanDialogProps {
  plan: PlanResponse;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: PlanUpdateRequest) => void;
}

const SEVERITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Simple editable string list */
function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  const update = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };
  const add = () => onChange([...items, ""]);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(idx, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-[#245A34] hover:text-[#245A34]"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Thêm
        </button>
      </div>
    </div>
  );
}

export function EditPlanDialog({ plan, isSubmitting, onClose, onSubmit }: EditPlanDialogProps) {
  const [form, setForm] = useState<{
    planName: string;
    diseaseName: string;
    severityLevel: string;
    urgency: string;
    estimatedCost: string;
    successIndicators: string;
    requiredInputs: string[];
    safetyWarnings: string[];
  }>({
    planName: plan.planName ?? "",
    diseaseName: plan.diseaseName ?? "",
    severityLevel: plan.severityLevel ?? "",
    urgency: plan.urgency ?? "",
    estimatedCost: plan.estimatedCost ?? "",
    successIndicators: plan.successIndicators ?? "",
    requiredInputs: plan.requiredInputs ?? [],
    safetyWarnings: plan.safetyWarnings ?? [],
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const field =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PlanUpdateRequest = {
      planName: form.planName || undefined,
      diseaseName: form.diseaseName || undefined,
      severityLevel: form.severityLevel || undefined,
      urgency: form.urgency || undefined,
      estimatedCost: form.estimatedCost || undefined,
      successIndicators: form.successIndicators || undefined,
      requiredInputs: form.requiredInputs.filter(Boolean),
      safetyWarnings: form.safetyWarnings.filter(Boolean),
    };
    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-2xl flex-col rounded-[2rem] border border-slate-100 bg-white shadow-2xl max-h-[90vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#245A34]/10">
              <Edit2 className="h-4 w-4 text-[#245A34]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Chỉnh sửa kế hoạch</h2>
              <p className="text-xs font-semibold text-slate-400">
                {plan.planName || plan.diseaseName || plan.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form body */}
        <form
          id="edit-plan-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Plan name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-planName" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tên kế hoạch
            </label>
            <input
              id="ep-planName"
              type="text"
              value={form.planName}
              onChange={field("planName")}
              placeholder="Nhập tên kế hoạch..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
          </div>

          {/* Disease name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-diseaseName" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tên bệnh / dịch hại
            </label>
            <input
              id="ep-diseaseName"
              type="text"
              value={form.diseaseName}
              onChange={field("diseaseName")}
              placeholder="Nhập tên bệnh..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
          </div>

          {/* Severity + Urgency row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ep-severity" className="text-xs font-black uppercase tracking-widest text-slate-500">
                Mức độ nghiêm trọng
              </label>
              <select
                id="ep-severity"
                value={form.severityLevel}
                onChange={field("severityLevel")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || "— Không xác định —"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ep-urgency" className="text-xs font-black uppercase tracking-widest text-slate-500">
                Khẩn cấp
              </label>
              <input
                id="ep-urgency"
                type="text"
                value={form.urgency}
                onChange={field("urgency")}
                placeholder="Ví dụ: Cao, Ngay lập tức..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
              />
            </div>
          </div>

          {/* Estimated cost */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-cost" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Chi phí ước tính
            </label>
            <input
              id="ep-cost"
              type="text"
              value={form.estimatedCost}
              onChange={field("estimatedCost")}
              placeholder="Ví dụ: 500,000 VNĐ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
          </div>

          {/* Success indicators */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-success" className="text-xs font-black uppercase tracking-widest text-slate-500">
              Dấu hiệu thành công
            </label>
            <textarea
              id="ep-success"
              rows={2}
              value={form.successIndicators}
              onChange={field("successIndicators")}
              placeholder="Mô tả các dấu hiệu cho thấy kế hoạch đạt hiệu quả..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
          </div>

          {/* Required inputs */}
          <StringListEditor
            label="Vật tư cần có"
            items={form.requiredInputs}
            onChange={(v) => setForm((prev) => ({ ...prev, requiredInputs: v }))}
          />

          {/* Safety warnings */}
          <StringListEditor
            label="Cảnh báo an toàn"
            items={form.safetyWarnings}
            onChange={(v) => setForm((prev) => ({ ...prev, safetyWarnings: v }))}
          />
        </form>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="edit-plan-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#245A34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1d4a2a] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
