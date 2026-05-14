import { useState } from 'react';
import { useCreateConsultingPlan } from '../queries/consulting.queries';
import { useCreatePlan } from '../../plant-management/plan/queries/plan.queries';
import { Select } from '../../../components/ui/Select';
import { ModalShell } from '../../../components/ui/ModalShell';
import type { PlanCreateRequest } from '../../plant-management/shared/types';

const severityOptions = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'CRITICAL', label: 'Nghiêm trọng' },
];

const urgencyOptions = [
  { value: '', label: '-- Không xác định --' },
  { value: 'LOW', label: 'Thấp' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HIGH', label: 'Cao' },
  { value: 'IMMEDIATE', label: 'Ngay lập tức' },
];

export interface CreatePlanDialogProps {
  /** When provided, creates a consulting plan for the farmer. Omit to create a plan for the current user. */
  farmerProfileId?: string;
  plantId?: string;
  onClose: () => void;
}

export function CreatePlanDialog({ farmerProfileId, plantId, onClose }: CreatePlanDialogProps) {
  const consultingMutation = useCreateConsultingPlan();
  const ownMutation = useCreatePlan();
  const isPending = farmerProfileId ? consultingMutation.isPending : ownMutation.isPending;
  const [form, setForm] = useState({
    diseaseName: '',
    planName: '',
    severityLevel: '',
    urgency: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.diseaseName.trim()) return;
    const payload: PlanCreateRequest = {
      plantId: plantId || undefined,
      diseaseName: form.diseaseName.trim(),
      question: form.planName.trim() || undefined,
      severityLevel: form.severityLevel.trim() || undefined,
      urgency: form.urgency.trim() || undefined,
    };
    if (farmerProfileId) {
      await consultingMutation.mutateAsync({ farmerProfileId, payload });
    } else {
      await ownMutation.mutateAsync(payload);
    }
    onClose();
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10';

  return (
    <ModalShell
      onClose={onClose}
      title={
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#245A34]">Treatment plan</span>
          <span className="block">Tạo kế hoạch điều trị</span>
        </span>
      }
      maxWidth="max-w-md"
    >
      <div className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Tên bệnh / vấn đề <span className="text-red-500">*</span>
            </label>
            <input
              required
              className={inputCls}
              value={form.diseaseName}
              onChange={(e) => setForm((f) => ({ ...f, diseaseName: e.target.value }))}
              placeholder="VD: Bệnh gỉ sắt cà phê..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Ghi chú tư vấn (tuỳ chọn)
            </label>
            <input
              className={inputCls}
              value={form.planName}
              onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
              placeholder="VD: Theo dõi và xử lý trong tháng 5..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Mức độ nghiêm trọng (tuỳ chọn)
            </label>
            <Select
              value={form.severityLevel}
              onChange={(val) => setForm((f) => ({ ...f, severityLevel: val as string }))}
              options={severityOptions}
              placeholder="-- Không xác định --"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Mức độ khẩn cấp (tuỳ chọn)
            </label>
            <Select
              value={form.urgency}
              onChange={(val) => setForm((f) => ({ ...f, urgency: val as string }))}
              options={urgencyOptions}
              placeholder="-- Không xác định --"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-[#245A34] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1a4226] disabled:opacity-60"
            >
              {isPending ? 'Đang tạo...' : 'Tạo kế hoạch'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
