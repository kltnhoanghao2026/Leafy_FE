import { useMemo } from 'react';
import { ClipboardList, Droplets, Sun, CalendarDays, Wheat } from 'lucide-react';
import { Select } from '../../../../components/ui/Select';
import { useSpecies } from '../../species/queries/species.queries';
import { Field, inputCls, errorInputCls, FieldError } from '../../../consulting/components/FormField';
import { InfoChip } from '../../../consulting/components/ConsultingInfoChip';
import type { PlanFormStateCreate, PlanFormStateEdit } from '../../shared/types';
export type { PlanFormStateCreate, PlanFormStateEdit } from '../../shared/types';

// ── Constants ─────────────────────────────────────────────────────────────────

export const SEVERITY_OPTIONS = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
];

// ── Form field value types ─────────────────────────────────────────────────────

// Note: PlanFormStateCreate and PlanFormStateEdit are now imported from shared/types.ts

// ── Helpers ───────────────────────────────────────────────────────────────────

function requiredInputsToString(arr: string[] | string | undefined): string {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.filter(Boolean).join(', ');
  return arr;
}

function safetyWarningsToString(arr: string[] | string | undefined): string {
  if (!arr) return '';
  if (Array.isArray(arr)) return arr.filter(Boolean).join(', ');
  return arr;
}

// ── String list editor (used in edit mode) ────────────────────────────────────

interface StringListEditorProps {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}

export function StringListEditor({ label, items, onChange }: StringListEditorProps) {
  const update = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };
  const add = () => onChange([...items, '']);
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => update(idx, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-[#245A34] hover:text-[#245A34]"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm
        </button>
      </div>
    </div>
  );
}

// ── Errors type ────────────────────────────────────────────────────────────────

export interface PlanInfoErrors {
  diseaseName?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

type PlanInfoSectionProps = {
  form: PlanFormStateCreate | PlanFormStateEdit;
  updateForm: (field: keyof PlanFormStateCreate | keyof PlanFormStateEdit, value: string | boolean) => void;
  farmPlotOptions: { value: string; label: string }[];
  errors?: PlanInfoErrors;
  /** When true, renders requiredInputs/safetyWarnings as string lists (edit mode). Default: false (create mode). */
  isEditMode?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function PlanInfoSection({
  form,
  updateForm,
  farmPlotOptions,
  errors,
  isEditMode = false,
}: PlanInfoSectionProps) {
  const speciesQuery = useSpecies();
  const speciesList = useMemo(() => speciesQuery.data ?? [], [speciesQuery.data]);

  const speciesOptions = useMemo(() => {
    if (speciesQuery.isLoading) return [{ value: '', label: 'Đang tải...' }];
    return [
      { value: '', label: '-- Không chọn giống --' },
      ...speciesList.map((s) => ({
        value: s.id,
        label: [s.commonName, s.cultivarName].filter(Boolean).join(' - '),
      })),
    ];
  }, [speciesList, speciesQuery.isLoading]);

  const selectedSpecies = useMemo(
    () => speciesList.find((s) => s.id === form.speciesId) ?? null,
    [speciesList, form.speciesId],
  );

  // Derive string/array values based on mode
  const requiredInputsValue = isEditMode
    ? requiredInputsToString((form as PlanFormStateEdit).requiredInputs)
    : (form as PlanFormStateCreate).requiredInputs;

  const safetyWarningsValue = isEditMode
    ? safetyWarningsToString((form as PlanFormStateEdit).safetyWarnings)
    : (form as PlanFormStateCreate).safetyWarnings;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-[#245A34]" strokeWidth={2.5} />
        <p className="text-sm font-black text-slate-900">Thông tin kế hoạch</p>
      </div>

      <div className="flex flex-col gap-2">
        <Field label="Tên bệnh / vấn đề" required>
          <input
            className={errors?.diseaseName ? errorInputCls : inputCls}
            value={form.diseaseName}
            onChange={(e) => updateForm('diseaseName', e.target.value)}
            placeholder="VD: Bệnh gỉ sắt cà phê..."
          />
          <FieldError msg={errors?.diseaseName} />
        </Field>

        <Field label="Tên kế hoạch (tuỳ chọn)">
          <input
            className={inputCls}
            value={form.planName}
            onChange={(e) => updateForm('planName', e.target.value)}
            placeholder="VD: Kế hoạch xử lý tháng 5..."
          />
        </Field>

        {farmPlotOptions.length > 1 && (
          <Field label="Trang trại (tuỳ chọn)">
            <Select
              className="mt-1.5"
              value={form.farmPlotId}
              onChange={(v) => updateForm('farmPlotId', v as string)}
              options={farmPlotOptions}
            />
          </Field>
        )}

        <Field label="Giống/Loài cây (tuỳ chọn)">
          <Select
            className="mt-1.5"
            value={form.speciesId}
            onChange={(v) => {
              const id = v as string;
              const found = speciesList.find((s) => s.id === id);
              updateForm('speciesId', id);
              updateForm('speciesName', found?.commonName ?? '');
            }}
            options={speciesOptions}
            disabled={speciesQuery.isLoading}
          />
        </Field>

        {/* Species info summary when selected */}
        {selectedSpecies && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#245A34]/15 bg-[#245A34]/5 p-3">
            <InfoChip icon={<Droplets className="h-3.5 w-3.5" />} label="Tưới nước" value={selectedSpecies.waterFrequencyDays ? `${selectedSpecies.waterFrequencyDays} ngày` : '—'} />
            <InfoChip icon={<Sun className="h-3.5 w-3.5" />} label="Ánh sáng" value={selectedSpecies.lightRequirements ?? '—'} />
            <InfoChip icon={<CalendarDays className="h-3.5 w-3.5" />} label="Đến thu hoạch" value={selectedSpecies.daysToMaturity ? `${selectedSpecies.daysToMaturity} ngày` : '—'} />
            <InfoChip icon={<Wheat className="h-3.5 w-3.5" />} label="Sản lượng dự kiến" value={selectedSpecies.expectedYieldKg ? `${selectedSpecies.expectedYieldKg} kg` : '—'} />
            {(selectedSpecies.commonDiseaseIds?.length ?? 0) > 0 && (
              <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Bệnh thường gặp:</span>
                {selectedSpecies.commonDiseaseIds!.map((did) => (
                  <span key={did} className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{did}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Field label="Mức độ nghiêm trọng">
            <Select
              className="mt-1.5"
              value={form.severityLevel}
              onChange={(v) => updateForm('severityLevel', v as string)}
              options={SEVERITY_OPTIONS}
            />
          </Field>
        </div>

        <Field label="Chỉ số thành công (tuỳ chọn)">
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={form.successIndicators}
            onChange={(e) => updateForm('successIndicators', e.target.value)}
            placeholder="VD: Cây hồi phục sau 2 tuần, không còn dấu hiệu bệnh..."
          />
        </Field>

        <Field label="Chi phí ước tính tổng (tuỳ chọn)">
          <input
            className={inputCls}
            value={form.estimatedCost}
            onChange={(e) => updateForm('estimatedCost', e.target.value)}
            placeholder="VD: 500.000 VNĐ"
          />
        </Field>

        {/* Required inputs / Safety warnings — render as string input in create mode, list editor in edit mode */}
        {isEditMode ? (
          <>
            <StringListEditor
              label="Vật tư / công cụ cần thiết (tuỳ chọn)"
              items={(form as PlanFormStateEdit).requiredInputs}
              onChange={(v) => updateForm('requiredInputs' as keyof PlanFormStateEdit, v as unknown as string)}
            />
            <StringListEditor
              label="Cảnh báo an toàn (tuỳ chọn)"
              items={(form as PlanFormStateEdit).safetyWarnings}
              onChange={(v) => updateForm('safetyWarnings' as keyof PlanFormStateEdit, v as unknown as string)}
            />
          </>
        ) : (
          <>
            <Field label="Vật tư / công cụ cần thiết (tuỳ chọn)">
              <input
                className={inputCls}
                value={requiredInputsValue}
                onChange={(e) => updateForm('requiredInputs', e.target.value)}
                placeholder="VD: Thuốc trừ sâu, bình xịt, găng tay..."
              />
            </Field>
            <Field label="Cảnh báo an toàn (tuỳ chọn)">
              <input
                className={inputCls}
                value={safetyWarningsValue}
                onChange={(e) => updateForm('safetyWarnings', e.target.value)}
                placeholder="VD: Đeo khẩu trang, mắt kính khi phun thuốc..."
              />
            </Field>
          </>
        )}

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => updateForm('isPublic', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#245A34] focus:ring-[#245A34]"
            />
            <span className="text-sm font-semibold text-slate-700">
              Công khai kế hoạch
            </span>
          </label>
          <span className="text-xs text-slate-400">
            (Ai cũng có thể xem)
          </span>
        </div>
      </div>
    </section>
  );
}

// ── Empty form helpers (for create mode) ──────────────────────────────────────

export const emptyForm = (): PlanFormStateCreate => ({
  diseaseName: '',
  planName: '',
  farmPlotId: '',
  speciesId: '',
  speciesName: '',
  severityLevel: '',
  successIndicators: '',
  estimatedCost: '',
  requiredInputs: '',
  safetyWarnings: '',
  isPublic: false,
});
