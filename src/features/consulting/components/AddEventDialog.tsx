import { useState } from 'react';
import { useCreateConsultingPlantEvent } from '../queries/consulting.queries';
import { Select } from '../../../components/ui/Select';
import { ModalShell } from '../../../components/ui/ModalShell';
import type { PlantEventCreateRequest, PlantEventType } from '../../plant-management/shared/types';

const eventTypeOptions: { value: PlantEventType; label: string }[] = [
  { value: 'IRRIGATION', label: 'Tưới nước' },
  { value: 'NUTRITION', label: 'Bón phân' },
  { value: 'WEED_CONTROL', label: 'Diệt cỏ' },
  { value: 'PRUNING', label: 'Cắt tỉa' },
  { value: 'SCOUTING', label: 'Khảo sát' },
  { value: 'DISEASE_DETECTED', label: 'Phát hiện bệnh' },
  { value: 'TREATMENT_APPLICATION', label: 'Xử lý thuốc' },
  { value: 'QUARANTINE', label: 'Cách ly' },
  { value: 'HEALTH_RECOVERY', label: 'Phục hồi' },
  { value: 'PHENOLOGY', label: 'Theo dõi sinh trưởng' },
  { value: 'REPOT', label: 'Thay chậu / vị trí' },
  { value: 'HARVEST', label: 'Thu hoạch' },
];

export interface AddEventDialogProps {
  farmerProfileId: string;
  plantId: string;
  onClose: () => void;
}

export function AddEventDialog({ farmerProfileId, plantId, onClose }: AddEventDialogProps) {
  const { mutateAsync, isPending } = useCreateConsultingPlantEvent();
  const [form, setForm] = useState<{
    eventType: PlantEventType;
    note: string;
    description: string;
    calculatedStartDate: string;
    isPlanned: boolean;
  }>({
    eventType: 'SCOUTING',
    note: '',
    description: '',
    calculatedStartDate: '',
    isPlanned: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.note.trim()) return;
    const payload: PlantEventCreateRequest = {
      plantId,
      eventType: form.eventType,
      note: form.note.trim(),
      description: form.description.trim() || undefined,
      calculatedStartDate: form.calculatedStartDate || undefined,
      isPlanned: form.isPlanned,
    };
    await mutateAsync({ farmerProfileId, payload });
    onClose();
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#245A34] focus:ring-2 focus:ring-[#245A34]/10';

  return (
    <ModalShell
      onClose={onClose}
      title={
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#245A34]">Plant event</span>
          <span className="block">Thêm sự kiện cây trồng</span>
        </span>
      }
      maxWidth="max-w-md"
    >
      <div className="p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Loại sự kiện <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.eventType}
              onChange={(val) => setForm((f) => ({ ...f, eventType: val as PlantEventType }))}
              options={eventTypeOptions}
              placeholder="Chọn loại sự kiện"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Ghi chú <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Nhập ghi chú..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Mô tả (tuỳ chọn)</label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả chi tiết..."
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Ngày bắt đầu (tuỳ chọn)
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.calculatedStartDate}
              onChange={(e) => setForm((f) => ({ ...f, calculatedStartDate: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[#245A34]"
              checked={form.isPlanned}
              onChange={(e) => setForm((f) => ({ ...f, isPlanned: e.target.checked }))}
            />
            Sự kiện đã lên kế hoạch
          </label>

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
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}
