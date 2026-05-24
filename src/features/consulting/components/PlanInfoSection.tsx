import { useMemo } from 'react';
import { ClipboardList, Droplets, Sun, CalendarDays, Wheat } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { useSpecies } from '../../plant-management/species/queries/species.queries';
import { Field, inputCls, errorInputCls, FieldError } from './FormField';
import { InfoChip } from './ConsultingInfoChip';
export type { PlanFormState } from '../utils/planFormHelpers';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
];


// ── Component ─────────────────────────────────────────────────────────────────

export interface PlanInfoErrors {
  diseaseName?: string;
}

interface PlanInfoSectionProps {
  form: PlanFormState;
  updateForm: (field: keyof PlanFormState, value: string | boolean) => void;
  farmPlotOptions: { value: string; label: string }[];
  errors?: PlanInfoErrors;
}

export function PlanInfoSection({ form, updateForm, farmPlotOptions, errors }: PlanInfoSectionProps) {
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
            rows={1}
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

        <Field label="Vật tư / công cụ cần thiết (tuỳ chọn)">
          <input
            className={inputCls}
            value={form.requiredInputs}
            onChange={(e) => updateForm('requiredInputs', e.target.value)}
            placeholder="VD: Thuốc trừ sâu, bình xịt, găng tay..."
          />
        </Field>

        <Field label="Cảnh báo an toàn (tuỳ chọn)">
          <input
            className={inputCls}
            value={form.safetyWarnings}
            onChange={(e) => updateForm('safetyWarnings', e.target.value)}
            placeholder="VD: Đeo khẩu trang, mắt kính khi phun thuốc..."
          />
        </Field>

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
