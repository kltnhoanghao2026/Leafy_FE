import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarCheck2,
  FlaskConical,
  AlertTriangle,
  LoaderCircle,
  List as ListIcon,
  CalendarDays,
} from "lucide-react";
import { getRagTreatmentPlan } from "../api/ragChat.api";
import { TreatmentPlanCalendar } from "../components/TreatmentPlanCalendar";

// Helpers for the plan structure
type JsonRecord = Record<string, unknown>;

const asPlanRecord = (v: unknown): JsonRecord =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRecord) : {};

const asPlanString = (v: unknown): string =>
  typeof v === "string" ? v.trim() : "";

const asPlanArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const asPlanNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const URGENCY_STYLES: Record<string, string> = {
  IMMEDIATE: "bg-red-600 text-white",
  HIGH: "bg-orange-500 text-white",
  NORMAL: "bg-slate-200 text-slate-700",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  IRRIGATION: "bg-blue-100 text-blue-700",
  NUTRITION: "bg-lime-100 text-lime-700",
  WEED_CONTROL: "bg-yellow-100 text-yellow-700",
  PRUNING: "bg-orange-100 text-orange-700",
  SCOUTING: "bg-teal-100 text-teal-700",
  DISEASE_DETECTED: "bg-red-100 text-red-700",
  TREATMENT_APPLICATION: "bg-purple-100 text-purple-700",
  QUARANTINE: "bg-rose-100 text-rose-700",
  HEALTH_RECOVERY: "bg-emerald-100 text-emerald-700",
  PHENOLOGY: "bg-indigo-100 text-indigo-700",
  REPOT: "bg-cyan-100 text-cyan-700",
  HARVEST: "bg-amber-100 text-amber-700",
};

const getEventColor = (type: string): string =>
  EVENT_TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600";

export function RagTreatmentPlanDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const { data: detailData, isLoading, error } = useQuery({
    queryKey: ["ragTreatmentPlan", planId],
    queryFn: () => getRagTreatmentPlan(planId!),
    enabled: !!planId,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-slate-600 font-medium">Không thể tải phác đồ điều trị.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-emerald-600 hover:underline"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // extract plan object from the response (detailData is likely the whole DB document or the core dict)
  // according to RagTreatmentPlanDoc structure, it's either in detailData.plan or detailData itself
  const plan = asPlanRecord(detailData.plan ? detailData.plan : detailData);

  const diseaseName = asPlanString(plan.diseaseName) || "Phác đồ điều trị chung";
  const severity = asPlanString(plan.severityLevel).toUpperCase();
  const urgency = asPlanString(plan.urgency).toUpperCase();
  const confidence = asPlanNumber(plan.confidenceScore);
  const schedule = asPlanArray(plan.schedule).map(asPlanRecord);
  const requiredInputs = asPlanArray(plan.requiredInputs).filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  const safetyWarnings = asPlanArray(plan.safetyWarnings).filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  const successIndicators = asPlanString(plan.successIndicators);
  const planCost = asPlanString(plan.estimatedCost);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Chi tiết phác đồ</h1>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-xs">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-3 bg-violet-100 rounded-xl shrink-0">
            <FlaskConical className="h-6 w-6 text-violet-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{diseaseName}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {severity && (
                <span
                  className={`inline-block rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${
                    SEVERITY_STYLES[severity] ||
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  Mức độ: {severity}
                </span>
              )}
              {urgency && (
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                    URGENCY_STYLES[urgency] ||
                    "bg-slate-200 text-slate-700"
                  }`}
                >
                  Độ khẩn: {urgency}
                </span>
              )}
            </div>
            {typeof confidence === "number" && (
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Độ tin cậy AI</span>
                  <span className="font-bold text-slate-700">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.round(confidence * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {schedule.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider inline-flex items-center gap-2">
                <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
                Lịch trình sự kiện ({schedule.length})
              </h3>
              
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "calendar" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Lịch
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === "list" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                  Danh sách
                </button>
              </div>
            </div>

            {viewMode === "calendar" ? (
              <TreatmentPlanCalendar schedule={schedule} />
            ) : (
              <div className="space-y-4">
                {schedule.map((ev, idx) => {
                  const evType = asPlanString(ev.eventType);
                  const note = asPlanString(ev.note);
                  const desc = asPlanString(ev.description);
                  const startDate = asPlanString(ev.calculatedStartDate);
                  const phi = asPlanNumber(ev.phiDays);
                  const ppe = asPlanString(ev.ppeRequired);
                  const evCost = asPlanString(ev.estimatedCost);

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getEventColor(
                            evType
                          )}`}
                        >
                          {evType.replace(/_/g, " ")}
                        </span>
                        <h4 className="font-bold text-slate-800 text-base">{note || evType}</h4>
                        {startDate && (
                          <span className="ml-auto text-sm font-medium text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            {startDate}
                          </span>
                        )}
                      </div>
                      {desc && <p className="text-sm text-slate-600 mb-3">{desc}</p>}
                      {(phi !== undefined || ppe || evCost) && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {phi !== undefined && (
                            <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-amber-700 font-semibold">
                              Thời gian cách ly (PHI): {phi} ngày
                            </span>
                          )}
                          {ppe && (
                            <span className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-slate-600">
                              Bảo hộ (PPE): {ppe}
                            </span>
                          )}
                          {evCost && (
                            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-emerald-700 font-semibold shrink-0">
                              Chi phí: {evCost}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
          {requiredInputs.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                Vật tư cần thiết
              </h3>
              <ul className="space-y-2">
                {requiredInputs.map((item, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {safetyWarnings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Lưu ý an toàn
              </h3>
              <ul className="space-y-2">
                {safetyWarnings.map((item, i) => (
                  <li key={i} className="text-sm text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-2">
                    <span className="mt-1 aspect-square h-4 w-4 flex items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700 shrink-0">
                      !
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {successIndicators && (
          <div className="mt-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
             <h3 className="text-sm font-bold text-indigo-900 mb-2">Dấu hiệu phục hồi thành công</h3>
             <p className="text-sm text-indigo-800">{successIndicators}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">Mã phác đồ: <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{planId}</code></p>
          {planCost && (
            <p className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg">
              Tổng chi phí dự kiến: <span className="text-emerald-600">{planCost}</span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
