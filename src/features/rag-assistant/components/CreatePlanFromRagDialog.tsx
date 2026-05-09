import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { useFarmPlots, useFarmZones } from "../../farm-management/queries";
import { useCreatePlan, usePlants } from "../../plant-management";
import type {
  PlantEventType,
  PlantResponse,
  PlanResponse,
} from "../../plant-management/shared/types";
import { isValidDateOnly } from "../../plant-management/shared/utils/dateOnly";
import { useMyProfile } from "../../settings/queries";
import type { DiseaseDiagnosisChatContext, RagPlan } from "../types";
import { getPlanTitle } from "../utils/ragResponse";
import {
  buildCreatePlanRequest,
  buildInitialPlanFormValues,
  type RagPlanFormValues,
  type ReviewScheduleItem,
} from "../utils/planMapper";

interface CreatePlanFromRagDialogProps {
  plan: RagPlan;
  context?: DiseaseDiagnosisChatContext | null;
  onClose: () => void;
}

const EVENT_TYPE_OPTIONS: Array<{ value: PlantEventType; label: string }> = [
  { value: "TREATMENT_APPLICATION", label: "ÃÂp dÃ¡Â»Â¥ng ÃâiÃ¡Â»Âu trÃ¡Â»â¹" },
  { value: "SCOUTING", label: "KiÃ¡Â»Æm tra vÃÂ°Ã¡Â»Ân" },
  { value: "DISEASE_DETECTED", label: "Ghi nhÃ¡ÂºÂ­n bÃ¡Â»â¡nh" },
  { value: "QUARANTINE", label: "CÃÂ¡ch ly" },
  { value: "PRUNING", label: "TÃ¡Â»â°a cÃÂ nh" },
  { value: "NUTRITION", label: "Dinh dÃÂ°Ã¡Â»Â¡ng" },
  { value: "IRRIGATION", label: "TÃÂ°Ã¡Â»âºi nÃÂ°Ã¡Â»âºc" },
  { value: "HEALTH_RECOVERY", label: "Theo dÃÂµi phÃ¡Â»Â¥c hÃ¡Â»âi" },
];

const toFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/401|unauthenticated|unauthorized|forbidden/i.test(message)) {
    return "BÃ¡ÂºÂ¡n cÃ¡ÂºÂ§n ÃâÃÆng nhÃ¡ÂºÂ­p hoÃ¡ÂºÂ·c khÃÂ´ng cÃÂ³ quyÃ¡Â»Ân tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹.";
  }
  if (/diseaseName|note|event type|validation/i.test(message)) {
    return "ThiÃ¡ÂºÂ¿u thÃÂ´ng tin bÃ¡ÂºÂ¯t buÃ¡Â»â¢c. Vui lÃÂ²ng kiÃ¡Â»Æm tra tÃÂªn bÃ¡Â»â¡nh vÃÂ  tÃ¡Â»Â«ng bÃÂ°Ã¡Â»âºc lÃ¡Â»â¹ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹.";
  }
  if (/network|timeout|failed/i.test(message)) {
    return "KhÃÂ´ng kÃ¡ÂºÂ¿t nÃ¡Â»âi ÃâÃÂ°Ã¡Â»Â£c plant-management-service. Vui lÃÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i sau.";
  }
  return "TÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹ thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i. Vui lÃÂ²ng kiÃ¡Â»Æm tra thÃÂ´ng tin vÃÂ  thÃ¡Â»Â­ lÃ¡ÂºÂ¡i.";
};

const updateScheduleItem = (
  values: RagPlanFormValues,
  itemId: string,
  patch: Partial<ReviewScheduleItem>,
): RagPlanFormValues => ({
  ...values,
  schedule: values.schedule.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item,
  ),
});

export function CreatePlanFromRagDialog({
  plan,
  context,
  onClose,
}: CreatePlanFromRagDialogProps) {
  const [values, setValues] = useState<RagPlanFormValues>(() =>
    ({
      ...buildInitialPlanFormValues(plan),
      plantId: context?.plantId || plan.plantId || undefined,
      farmPlotId: context?.farmPlotId || plan.farmPlotId || undefined,
      farmZoneId: context?.farmZoneId || plan.farmZoneId || undefined,
    }),
  );
  const [createdPlan, setCreatedPlan] = useState<PlanResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const profileQuery = useMyProfile();
  const ownerProfileId = profileQuery.data?.id ?? "";
  const plantsQuery = usePlants();
  const farmPlotsQuery = useFarmPlots(ownerProfileId, !!ownerProfileId);
  const farmZonesQuery = useFarmZones(values.farmPlotId ?? "", !!values.farmPlotId);
  const createMutation = useCreatePlan();

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
  const activeScheduleIsValid =
    activeSchedule.length > 0 &&
    activeSchedule.every(
      (item) =>
        item.note.trim() &&
        item.eventType &&
        isValidDateOnly(item.scheduledDate) &&
        item.durationDays >= 0,
    );
  const canSubmit =
    Boolean((values as any).diseaseName.trim()) &&
    isValidDateOnly(values.startDate) &&
    Boolean(values.farmPlotId || values.plantId) &&
    activeScheduleIsValid &&
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

    if (!(values as any).diseaseName.trim()) {
      setError("Vui lÃÂ²ng nhÃ¡ÂºÂ­p tÃÂªn bÃ¡Â»â¡nh/vÃ¡ÂºÂ¥n ÃâÃ¡Â»Â trÃÂ°Ã¡Â»âºc khi tÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch.");
      return;
    }
    if (!values.farmPlotId && !values.plantId) {
      setError("Vui lÃÂ²ng chÃ¡Â»Ân cÃÂ¢y trÃ¡Â»âng hoÃ¡ÂºÂ·c vÃÂ°Ã¡Â»Ân ÃÂ¡p dÃ¡Â»Â¥ng kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch.");
      return;
    }
    if (!isValidDateOnly(values.startDate)) {
      setError("NgÃÂ y bÃ¡ÂºÂ¯t ÃâÃ¡ÂºÂ§u khÃÂ´ng hÃ¡Â»Â£p lÃ¡Â»â¡. Vui lÃÂ²ng chÃ¡Â»Ân lÃ¡ÂºÂ¡i ngÃÂ y.");
      return;
    }
    if (!activeSchedule.length) {
      setError("KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI chÃÂ°a cÃÂ³ lÃ¡Â»â¹ch. Vui lÃÂ²ng thÃÂªm ÃÂ­t nhÃ¡ÂºÂ¥t mÃ¡Â»â¢t bÃÂ°Ã¡Â»âºc hoÃ¡ÂºÂ·c bÃ¡ÂºÂ­t lÃ¡ÂºÂ¡i mÃ¡Â»â¢t bÃÂ°Ã¡Â»âºc.");
      return;
    }
    if (activeSchedule.some((item) => !item.note.trim())) {
      setError("MÃ¡Â»âi bÃÂ°Ã¡Â»âºc ÃâiÃ¡Â»Âu trÃ¡Â»â¹ cÃ¡ÂºÂ§n cÃÂ³ tiÃÂªu ÃâÃ¡Â»Â/nÃ¡Â»â¢i dung ngÃ¡ÂºÂ¯n.");
      return;
    }
    if (activeSchedule.some((item) => !item.eventType)) {
      setError("MÃ¡Â»âi bÃÂ°Ã¡Â»âºc ÃâiÃ¡Â»Âu trÃ¡Â»â¹ cÃ¡ÂºÂ§n cÃÂ³ loÃ¡ÂºÂ¡i lÃ¡Â»â¹ch chÃÆm sÃÂ³c.");
      return;
    }
    if (activeSchedule.some((item) => !isValidDateOnly(item.scheduledDate))) {
      setError("NgÃÂ y dÃ¡Â»Â± kiÃ¡ÂºÂ¿n cÃ¡Â»Â§a tÃ¡Â»Â«ng bÃÂ°Ã¡Â»âºc phÃ¡ÂºÂ£i hÃ¡Â»Â£p lÃ¡Â»â¡.");
      return;
    }
    if (activeSchedule.some((item) => item.durationDays < 0)) {
      setError("SÃ¡Â»â ngÃÂ y kÃÂ©o dÃÂ i cÃ¡Â»Â§a tÃ¡Â»Â«ng bÃÂ°Ã¡Â»âºc phÃ¡ÂºÂ£i lÃÂ  sÃ¡Â»â khÃÂ´ng ÃÂ¢m.");
      return;
    }

    try {
      const payload = buildCreatePlanRequest(plan, values);
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
              AI/RAG Ã¢â â Plant management
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              TÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Review kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI trÃÂ°Ã¡Â»âºc khi tÃ¡ÂºÂ¡o treatment plan thÃ¡ÂºÂ­t vÃÂ  sinh lÃ¡Â»â¹ch chÃÆm sÃÂ³c.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="ÃÂÃÂ³ng"
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
                  KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch Ã„â€˜iÃ¡Â»Â u trÃ¡Â»â€¹ Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c tÃ¡ÂºÂ¡o thÃƒÂ nh cÃƒÂ´ng.
                </h4>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  Plant-management-service đã nhận kế hoạch và tự tạo {createdPlan.events?.length ?? 0} lịch chăm sóc liên quan.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {createdPlan.id ? (
                    <Link
                      to={ROUTES.DASHBOARD.PLAN_DETAIL(createdPlan.id)}
                      className="rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a]"
                    >
                      Xem kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch Ã„â€˜iÃ¡Â»Â u trÃ¡Â»â€¹
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                  >
                    ÃÂÃÂ³ng
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                ThÃÂ´ng tin kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI
              </p>
              <h4 className="mt-2 text-xl font-black text-slate-900">
                {getPlanTitle(plan)}
              </h4>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    TÃÂªn kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch
                  </span>
                  <input
                    value={values.title}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        planName: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    BÃ¡Â»â¡nh/vÃ¡ÂºÂ¥n ÃâÃ¡Â»Â
                  </span>
                  <input
                    value={(values as any).diseaseName}
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
                    MÃ¡Â»Â©c ÃâÃ¡Â»â¢
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
                    NgÃÂ y bÃ¡ÂºÂ¯t ÃâÃ¡ÂºÂ§u
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
                {plan.summary || plan.question || "KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI chÃÂ°a cÃÂ³ tÃÂ³m tÃ¡ÂºÂ¯t. BÃ¡ÂºÂ¡n vÃ¡ÂºÂ«n cÃÂ³ thÃ¡Â»Æ chÃ¡Â»Ân scope vÃÂ  review lÃ¡Â»â¹ch trÃÂ°Ã¡Â»âºc khi tÃ¡ÂºÂ¡o."}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
              <h4 className="text-lg font-black text-slate-900">ChÃ¡Â»Ân phÃ¡ÂºÂ¡m vi ÃÂ¡p dÃ¡Â»Â¥ng</h4>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                    CÃÂ¢y trÃ¡Â»âng
                  </span>
                  <select
                    value={values.plantId ?? ""}
                    onChange={(event) => handlePlantChange(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                    disabled={plantsQuery.isLoading}
                  >
                    <option value="">
                      {plantsQuery.isLoading ? "ÃÂang tÃ¡ÂºÂ£i cÃÂ¢y..." : "KhÃÂ´ng chÃ¡Â»Ân cÃÂ¢y cÃ¡Â»Â¥ thÃ¡Â»Æ"}
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
                    VÃÂ°Ã¡Â»Ân
                  </span>
                  <select
                    value={values.farmPlotId ?? ""}
                    onChange={(event) => handleFarmPlotChange(event.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#245A34]"
                    disabled={farmPlotsQuery.isLoading}
                  >
                    <option value="">
                      {farmPlotsQuery.isLoading ? "ÃÂang tÃ¡ÂºÂ£i vÃÂ°Ã¡Â»Ân..." : "ChÃ¡Â»Ân vÃÂ°Ã¡Â»Ân"}
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
                    Khu vÃ¡Â»Â±c
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
                        ? "ChÃ¡Â»Ân vÃÂ°Ã¡Â»Ân trÃÂ°Ã¡Â»âºc"
                        : farmZonesQuery.isLoading
                          ? "ÃÂang tÃ¡ÂºÂ£i khu vÃ¡Â»Â±c..."
                          : "KhÃÂ´ng chÃ¡Â»Ân khu vÃ¡Â»Â±c"}
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
                  MÃ¡Â»â¢t phÃ¡ÂºÂ§n dÃ¡Â»Â¯ liÃ¡Â»â¡u cÃÂ¢y/vÃÂ°Ã¡Â»Ân/khu vÃ¡Â»Â±c chÃÂ°a tÃ¡ÂºÂ£i ÃâÃÂ°Ã¡Â»Â£c. UI khÃÂ´ng crash, nhÃÂ°ng cÃ¡ÂºÂ§n chÃ¡Â»Ân ÃâÃ¡Â»Â§ scope trÃÂ°Ã¡Â»âºc khi tÃ¡ÂºÂ¡o.
                </p>
              ) : null}
            </section>

            <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-lg font-black text-slate-900">Review lÃ¡Â»â¹ch ÃâiÃ¡Â»Âu trÃ¡Â»â¹</h4>
                <span className="text-sm font-bold text-slate-500">
                  {activeSchedule.length}/{values.schedule.length} bÃÂ°Ã¡Â»âºc ÃâÃÂ°Ã¡Â»Â£c chÃ¡Â»Ân
                </span>
              </div>
              {!values.schedule.length ? (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  KÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch AI khÃÂ´ng cÃÂ³ schedule. Phase nÃÂ y cÃ¡ÂºÂ§n ÃÂ­t nhÃ¡ÂºÂ¥t mÃ¡Â»â¢t bÃÂ°Ã¡Â»âºc ÃâÃ¡Â»Æ plant-management sinh PlantEvent.
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
                        BÃÂ°Ã¡Â»âºc {index + 1}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.9fr_0.8fr]">
                      <label className="block">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                          TiÃÂªu ÃâÃ¡Â»Â/note
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
                          LoÃ¡ÂºÂ¡i lÃ¡Â»â¹ch
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
                          NgÃÂ y dÃ¡Â»Â± kiÃ¡ÂºÂ¿n
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
                        MÃÂ´ tÃ¡ÂºÂ£
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
                HÃ¡Â»Â§y
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
                TÃ¡ÂºÂ¡o kÃ¡ÂºÂ¿ hoÃ¡ÂºÂ¡ch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
