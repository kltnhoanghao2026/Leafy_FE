import { ClipboardList } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import type { PlantEventCreateRequest } from '../../plant-management/shared/types';
import { Field, inputCls, errorInputCls, FieldError } from './FormField';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanFormState {
  diseaseName: string;
  question: string;
  farmPlotId: string;
  severityLevel: string;
  urgency: string;
  successIndicators: string;
  estimatedCost: string;
}

export const emptyForm = (): PlanFormState => ({
  diseaseName: '',
  question: '',
  farmPlotId: '',
  severityLevel: '',
  urgency: '',
  successIndicators: '',
  estimatedCost: '',
});

// Shared with EventScheduleSection
export const emptyEvent = (): PlantEventCreateRequest => ({
  eventType: '' as PlantEventCreateRequest['eventType'],
  note: '',
  description: '',
  daysFromNow: undefined,
  durationDays: undefined,
  estimatedCost: '',
});

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'CRITICAL', label: 'Nghiêm trọng' },
];

const URGENCY_OPTIONS = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'IMMEDIATE', label: 'Ngay lập tức' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export interface PlanInfoErrors {
  diseaseName?: string;
}

interface PlanInfoSectionProps {
  form: PlanFormState;
  updateForm: (field: keyof PlanFormState, value: string) => void;
  farmPlotOptions: { value: string; label: string }[];
  errors?: PlanInfoErrors;
}

export function PlanInfoSection({ form, updateForm, farmPlotOptions, errors }: PlanInfoSectionProps) {
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
            value={form.question}
            onChange={(e) => updateForm('question', e.target.value)}
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

        <div className="grid grid-cols-2 gap-2">
          <Field label="Mức độ nghiêm trọng">
            <Select
              className="mt-1.5"
              value={form.severityLevel}
              onChange={(v) => updateForm('severityLevel', v as string)}
              options={SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="Mức độ khẩn cấp">
            <Select
              className="mt-1.5"
              value={form.urgency}
              onChange={(v) => updateForm('urgency', v as string)}
              options={URGENCY_OPTIONS}
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
      </div>
    </section>
  );
}
