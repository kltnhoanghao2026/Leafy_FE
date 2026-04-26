import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { useCreateTreatmentPlan, usePlants } from "../../plant-management/queries";
import type {
  PlantEventType,
  PlantResponse,
  TreatmentPlanResponse,
} from "../../plant-management/types";
import { useMyProfile } from "../../settings/queries";
import type { DiseaseDiagnosisChatContext, RagTreatmentPlan } from "../types";
import { getPlanTitle } from "../utils/ragResponse";
import {
  buildCreateTreatmentPlanRequest,
  buildInitialTreatmentPlanFormValues,
  type RagTreatmentPlanFormValues,
  type ReviewScheduleItem,
} from "../utils/treatmentPlanMapper";

interface CreateTreatmentPlanFromRagDialogProps {
  plan: RagTreatmentPlan;
  context?: DiseaseDiagnosisChatContext | null;
  onClose: () => void;
}

const EVENT_TYPE_OPTIONS: Array<{ value: PlantEventType; label: string }> = [
  { value: "TREATMENT_APPLICATION", label: "Áp dụng điều trị" },
  { value: "SCOUTING", label: "Kiểm tra vườn" },
  { value: "DISEASE_DETECTED", label: "Ghi nhận bệnh" },
  { value: "QUARANTINE", label: "Cách ly" },
  { value: "PRUNING", label: "Tỉa cành" },
  { value: "NUTRITION", label: "Dinh dưỡng" },
  { value: "IRRIGATION", label: "Tưới nước" },
  { value: "HEALTH_RECOVERY", label: "Theo dõi phục hồi" },
];

const toFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/401|unauthenticated|unauthorized|forbidden/i.test(message)) {
    return "Bạn cần đăng nhập hoặc không có quyền tạo kế hoạch điều trị.";
  }
  if (/diseaseName|note|event type|validation/i.test(message)) {
    return "Thiếu thông tin bắt buộc. Vui lòng kiểm tra tên bệnh và từng bước lịch điều trị.";
  }
  if (/network|timeout|failed/i.test(message)) {
    return "Không kết nối được plant-management-service. Vui lòng thử lại sau.";
  }
  return "Tạo kế hoạch điều trị thất bại. Vui lòng kiểm tra thông tin và thử lại.";
};

const updateScheduleItem = (
  values: RagTreatmentPlanFormValues,
  itemId: string,
  patch: Partial<ReviewScheduleItem>,
): RagTreatmentPlanFormValues => ({
  ...values,
  schedule: values.schedule.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item,
  ),
});

export function CreateTreatmentPlanFromRagDialog({
  plan,
  context,
  onClose,
}: CreateTreatmentPlanFromRagDialogProps) {
  const [values, setValues] = useState<RagTreatmentPlanFormValues>(() =>
    ({
      ...buildInitialTreatmentPlanFormValues(plan),
      plantId: context?.plantId || plan.plantId || undefined,
      farmPlotId: context?.farmPlotId || plan.farmPlotId || undefined,
      farmZoneId: context?.farmZoneId || plan.farmZoneId || undefined,
    }),
  );
  const [createdPlan, setCreatedPlan] = useState<TreatmentPlanResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plantsQuery = usePlants();
  const farmPlotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const farmZonesQuery = useFarmZones(values.farmPlotId ?? "", !!values.farmPlotId);
  const createMutation = useCreateTreatmentPlan();

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const farmPlots = useMemo(
    () => farmPlotsQuery.data ?? [],
    [farmPlotsQuery.data],
  );
  const farmZones = useMemo(
    () => farmZonesQuery.data ?? [],
    [farmZonesQuery.data],
  );
  const selectedPlant = useMemo(
    () => plants.find((plant) => plant.id === values.plantId) ?? null,
    [plants, values.plantId],
  );

  useEffect(() => {
    if (!selectedPlant) return;
    setValues((current) => ({
      ...current,
      farmPlotId: selectedPlant.farmPlotId || current.farmPlotId,
    }));
  }, [selectedPlant]);

  const activeSchedule = values.schedule.filter((item) => item.enabled);
  const canSubmit =
    Boolean(values.diseaseName.trim()) &&
    Boolean(values.farmPlotId || values.plantId) &&
    activeSchedule.length > 0 &&
    activeSchedule.every((item) => item.note.trim() && item.eventType) &&
    !createMutation.isPending;

  const handlePlantChange = (plantId: string) => {
    const plant = plants.find((item) => item.id === plantId) as
      | (PlantResponse & { farmZoneId?: string | null })
      | undefined;
    setValues((current) => ({
      ...current,
      plantId: plantId || undefined,
      farmPlotId: plant?.farmPlotId || current.farmPlotId,
      farmZoneId: plant?.farmZoneId || current.farmZoneId,
    }));
  };

  const handleFarmPlotChange = (farmPlotId: string) => {
    setValues((current) => ({
      ...current,
      farmPlotId: farmPlotId || undefined,
      farmZoneId: undefined,
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!values.diseaseName.trim()) {
      setError("Vui lòng nhập tên bệnh/vấn đề trước khi tạo kế hoạch.");
      return;
    }
    if (!values.farmPlotId && !values.plantId) {
      setError("Vui lòng chọn cây trồng hoặc vườn áp dụng kế hoạch.");
      return;
    }
    if (!activeSchedule.length) {
      setError("Kế hoạch AI chưa có lịch. Vui lòng thêm ít nhất một bước hoặc bật lại một bước.");
      return;
    }
    if (activeSchedule.some((item) => !item.note.trim())) {
      setError("Mỗi bước điều trị cần có tiêu đề/nội dung ngắn.");
      return;
    }

    try {
      const payload = buildCreateTreatmentPlanRequest(plan, values);
      const result = await createMutation.mutateAsync(payload);
      setCreatedPlan(result);
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#245A34]">
              AI/RAG → Plant management
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              Tạo kế hoạch điều trị
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Review kế hoạch AI trước khi tạo treatment plan thật và sinh lịch chăm sóc.
            </p>
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

        {createdPlan ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-700" />
              <div>
                <h4 className="text-lg font-black text-emerald-900">
                  Kế hoạch điều trị đã được tạo thành công.
                </h4>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Plant-management-service đã nhận kế hoạch và tự tạo {createdPlan.plantEventIds?.length ?? 0} lịch chăm sóc liên quan.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {createdPlan.id ? (
                    <Link
                      to={ROUTES.DASHBOARD.TREATMENT_PLAN_DETAIL(createdPlan.id)}
                      className="rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                    >
                      Xem kế hoạch điều trị
                    </Link>
                  ) : null}
                  {createdPlan.plantId ? (
                    <Link
                      to={ROUTES.DASHBOARD.PLANT_DETAIL(createdPlan.plantId)}
                      className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                    >
                      Xem cây trồng
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Thông tin kế hoạch AI
              </p>
              <h4 className="mt-2 text-xl font-black text-slate-900">
                {getPlanTitle(plan)}
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Bệnh/vấn đề
                  </span>
                  <input
                    value={values.diseaseName}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        diseaseName: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Mức độ
                  </span>
                  <input
                    value={values.severityLevel ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        severityLevel: event.target.value || undefined,
                      }))
                    }
                    placeholder="LOW / MEDIUM / HIGH"
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Ngày bắt đầu
                  </span>
                  <input
                    type="date"
                    value={values.startDate}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                  />
                </label>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {plan.summary || plan.question || "Kế hoạch AI chưa có tóm tắt. Bạn vẫn có thể chọn scope và review lịch trước khi tạo."}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
              <h4 className="text-lg font-black text-slate-900">Chọn phạm vi áp dụng</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Cây trồng
                  </span>
                  <select
                    value={values.plantId ?? ""}
                    onChange={(event) => handlePlantChange(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                    disabled={plantsQuery.isLoading}
                  >
                    <option value="">
                      {plantsQuery.isLoading ? "Đang tải cây..." : "Không chọn cây cụ thể"}
                    </option>
                    {plants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.nickName || plant.plantNumber || plant.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Vườn
                  </span>
                  <select
                    value={values.farmPlotId ?? ""}
                    onChange={(event) => handleFarmPlotChange(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                    disabled={farmPlotsQuery.isLoading}
                  >
                    <option value="">
                      {farmPlotsQuery.isLoading ? "Đang tải vườn..." : "Chọn vườn"}
                    </option>
                    {farmPlots.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Khu vực
                  </span>
                  <select
                    value={values.farmZoneId ?? ""}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        farmZoneId: event.target.value || undefined,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                    disabled={!values.farmPlotId || farmZonesQuery.isLoading}
                  >
                    <option value="">
                      {!values.farmPlotId
                        ? "Chọn vườn trước"
                        : farmZonesQuery.isLoading
                          ? "Đang tải khu vực..."
                          : "Không chọn khu vực"}
                    </option>
                    {farmZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.zoneName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {(plantsQuery.isError || farmPlotsQuery.isError || farmZonesQuery.isError) ? (
                <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  Một phần dữ liệu cây/vườn/khu vực chưa tải được. UI không crash, nhưng cần chọn đủ scope trước khi tạo.
                </p>
              ) : null}
            </section>

            <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-lg font-black text-slate-900">Review lịch điều trị</h4>
                <span className="text-sm font-bold text-slate-500">
                  {activeSchedule.length}/{values.schedule.length} bước được chọn
                </span>
              </div>
              {!values.schedule.length ? (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Kế hoạch AI không có schedule. Phase này cần ít nhất một bước để plant-management sinh PlantEvent.
                </div>
              ) : null}
              <div className="mt-4 space-y-4">
                {values.schedule.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm font-black text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            setValues((current) =>
                              updateScheduleItem(current, item.id, {
                                enabled: event.target.checked,
                              }),
                            )
                          }
                        />
                        Bước {index + 1}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.9fr_0.8fr]">
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Tiêu đề/note
                        </span>
                        <input
                          value={item.note}
                          onChange={(event) =>
                            setValues((current) =>
                              updateScheduleItem(current, item.id, {
                                note: event.target.value,
                              }),
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Loại lịch
                        </span>
                        <select
                          value={item.eventType}
                          onChange={(event) =>
                            setValues((current) =>
                              updateScheduleItem(current, item.id, {
                                eventType: event.target.value as PlantEventType,
                              }),
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                        >
                          {EVENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Ngày dự kiến
                        </span>
                        <input
                          type="date"
                          value={item.scheduledDate}
                          onChange={(event) =>
                            setValues((current) =>
                              updateScheduleItem(current, item.id, {
                                scheduledDate: event.target.value,
                              }),
                            )
                          }
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                        />
                      </label>
                    </div>
                    <label className="mt-3 block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Mô tả
                      </span>
                      <textarea
                        value={item.description}
                        onChange={(event) =>
                          setValues((current) =>
                            updateScheduleItem(current, item.id, {
                              description: event.target.value,
                            }),
                          )
                        }
                        rows={2}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : null}

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
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Tạo kế hoạch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
