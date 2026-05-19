import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Search,
  ShieldCheck,
  FileText,
  RefreshCw,
  Leaf,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import { ROUTES } from "../../../../lib/routes";
import { diseaseApi } from "../../../disease-diagnosis/api/disease.api";
import { getDiseaseLabel } from "../../../disease-diagnosis/utils/diseaseLabels";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanGenerationState {
  disease_name: string;
  /** Severity level from disease detection: LOW | MEDIUM | HIGH. Drives plan aggressiveness. */
  severity_level?: string;
  plantId?: string;
  farmPlotId?: string;
  farmZoneId?: string;
  image_url?: string;
  /** Display label for the disease (pre-resolved) */
  diseaseLabel?: string;
  /** Controls whether web search is invoked during plan generation */
  include_web_search?: boolean;
}

type StepStatus = "idle" | "running" | "done" | "error";

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  durationMs: number; // approximate simulated minimum display time
}

/**
 * Pipeline steps mirror the plan_agent graph nodes:
 *
 *   env_state → hybrid_search → reranker → check_doc_quality
 *                                              ├─ sufficient  → planner
 *                                              └─ insufficient → web_search_plan → planner
 *                                                                          ↓
 *                                                                    safety_audit
 *                                                                      ↓
 *                                                          check_safety_compliance
 *                                                            ├─ safe  → END
 *                                                            └─ unsafe → refine → [loop]
 *
 * The "finalize" step represents the time between safety_audit completing and the
 * HTTP response arriving — it carries no separate graph node.
 * check_doc_quality, web_search_plan retries, and refine are implicit.
 * Whether web search was used is surfaced via v2Result.metadata.web_search_used.
 */
const PIPELINE_STEPS = [
  {
    id: "env_state",
    label: "Thu thập dữ liệu môi trường",
    description: "Truy vấn cảm biến IoT và ngữ cảnh farm/zone để cá nhân hoá kế hoạch",
    icon: <Leaf className="h-5 w-5" />,
    durationMs: 800,
  },
  {
    id: "hybrid_search",
    label: "Tìm kiếm tri thức",
    description: "Truy vấn cơ sở tri thức nông nghiệp — vector search + BM25",
    icon: <Search className="h-5 w-5" />,
    durationMs: 3000,
  },
  {
    id: "reranker",
    label: "Đánh giá & xếp hạng",
    description:
      "Cross-encoder chấm điểm và sắp xếp tài liệu. Bổ sung tìm kiếm web nếu chất lượng không đủ",
    icon: <Wand2 className="h-5 w-5" />,
    durationMs: 2000,
  },
  {
    id: "planner",
    label: "Lập kế hoạch điều trị",
    description:
      "AI xây dựng phác đồ điều trị và phục hồi chi tiết theo bệnh phát hiện",
    icon: <FileText className="h-5 w-5" />,
    durationMs: 4000,
  },
  {
    id: "safety_audit",
    label: "Kiểm tra an toàn",
    description:
      "Xác minh liều lượng thuốc, PHI, và tuân thủ danh mục PPD Việt Nam",
    icon: <ShieldCheck className="h-5 w-5" />,
    durationMs: 1500,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanGenerationProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state?.payload as PlanGenerationState | undefined;

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(PIPELINE_STEPS.map((s) => [s.id, "idle"])),
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [globalStatus, setGlobalStatus] = useState<
    "running" | "done" | "error"
  >("running");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track if the API call has resolved
  const apiResultRef = useRef<{
    resolved: boolean;
    savedPlanId?: string;
    error?: string;
  }>({ resolved: false });

  // Redirect if no payload
  useEffect(() => {
    if (!payload) {
      navigate(ROUTES.DASHBOARD.DISEASE_DIAGNOSIS, { replace: true });
    }
  }, [payload, navigate]);

  // ── Step animation driver ────────────────────────────────────────────────
  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    const advanceStep = async (index: number) => {
      if (cancelled || index >= PIPELINE_STEPS.length) return;
      const step = PIPELINE_STEPS[index];

      setCurrentStepIndex(index);
      setStepStatuses((prev) => ({ ...prev, [step.id]: "running" }));

      // Minimum display time for this step
      await new Promise((r) => setTimeout(r, step.durationMs));
      if (cancelled) return;

      // If it's the last animated step, wait for the API to complete
      if (index === PIPELINE_STEPS.length - 1) {
        // Poll until API resolves
        while (!apiResultRef.current.resolved) {
          await new Promise((r) => setTimeout(r, 300));
          if (cancelled) return;
        }
        if (apiResultRef.current.error) {
          setStepStatuses((prev) => ({ ...prev, [step.id]: "error" }));
          setGlobalStatus("error");
          setErrorMessage(apiResultRef.current.error!);
        } else {
          setStepStatuses((prev) => ({ ...prev, [step.id]: "done" }));
          setGlobalStatus("done");
          // Navigate to plan detail page with the saved plan
          setTimeout(() => {
            if (!cancelled) {
              if (apiResultRef.current.savedPlanId) {
                navigate(ROUTES.DASHBOARD.PLAN_DETAIL(apiResultRef.current.savedPlanId), {
                  replace: true,
                });
              } else {
                navigate(ROUTES.DASHBOARD.PLANS, { replace: true });
              }
            }
          }, 900);
        }
        return;
      }

      setStepStatuses((prev) => ({ ...prev, [step.id]: "done" }));
      await advanceStep(index + 1);
    };

    void advanceStep(0);
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fire the actual API call ─────────────────────────────────────────────
  const apiCalledRef = useRef(false);

  useEffect(() => {
    if (!payload) return;
    if (apiCalledRef.current) return;
    apiCalledRef.current = true;

    const run = async () => {
      try {
        // Backend generates the plan, persists it to plant-management-service,
        // and returns the saved plan ID. Frontend just reads it.
        const v2Result = await diseaseApi.generateTreatmentPlanV2({
          disease_name: payload.disease_name,
          severity_level: payload.severity_level,
          plantId: payload.plantId,
          farmPlotId: payload.farmPlotId,
          farmZoneId: payload.farmZoneId,
          image_url: payload.image_url,
          include_web_search: payload.include_web_search,
        });

        if (!v2Result?.plan) {
          apiResultRef.current = {
            resolved: true,
            error:
              "Không nhận được kế hoạch từ hệ thống. Vui lòng thử lại.",
          };
          return;
        }

        // saved_plan_id is null only when backend persistence failed (non-fatal).
        // Navigation will go to PLANS list if save failed, PLAN_DETAIL if it succeeded.
        apiResultRef.current = {
          resolved: true,
          savedPlanId: v2Result.saved_plan_id ?? undefined,
        };
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Không thể kết nối đến hệ thống RAG. Vui lòng thử lại.";
        apiResultRef.current = { resolved: true, error: msg };
      }
    };

    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!payload) return null;

  const diseaseLabel =
    payload.diseaseLabel || getDiseaseLabel(payload.disease_name);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex h-full w-full flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:p-8 xl:p-10">
        
        {/* LEFT COLUMN: Header & Hero */}
        <div className="flex flex-col gap-4 lg:w-[45%] lg:min-w-[450px]">
          {/* Back nav */}
          <div className="flex items-center shrink-0">
            <Link
              to={ROUTES.DASHBOARD.DISEASE_DIAGNOSIS}
              className="group flex items-center gap-2 rounded-xl py-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-[#245A34]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
              Quay lại chẩn đoán
            </Link>
          </div>

          {/* Hero card - stretches to fill available height on desktop */}
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-[2rem] bg-[#245A34] p-8 text-white shadow-xl shadow-[#245A34]/10 ring-1 ring-slate-900/5 sm:p-10">
            {/* Animated background blobs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 animate-pulse rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 animate-pulse rounded-full bg-teal-400/20 blur-3xl" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 flex h-full flex-col justify-center">
              <div>
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-md ring-1 ring-white/20">
                  <Leaf className="h-8 w-8 text-emerald-300" strokeWidth={2.5} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-300/80">
                  AI Agronomic Planner
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  Đang tạo kế hoạch...
                </h1>
                <p className="mt-3 max-w-sm text-[15px] font-medium leading-relaxed text-emerald-50/80">
                  Hệ thống đang phân tích dữ liệu bệnh{" "}
                  <span className="font-bold text-white">{diseaseLabel}</span>{" "}
                  để xây dựng phác đồ điều trị và phục hồi chuyên sâu.
                </p>
              </div>

              {/* Status badge pushed to bottom or below text */}
              <div className="mt-8">
                <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 px-5 py-2.5 backdrop-blur-md ring-1 ring-white/20">
                  {globalStatus === "running" && (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-300" strokeWidth={2.5} />
                      <span className="text-sm font-bold tracking-wide text-white">
                        Đang xử lý dữ liệu
                      </span>
                    </>
                  )}
                  {globalStatus === "done" && (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
                      <span className="text-sm font-bold tracking-wide text-white">
                        Hoàn tất! Đang chuyển hướng...
                      </span>
                    </>
                  )}
                  {globalStatus === "error" && (
                    <>
                      <XCircle className="h-5 w-5 text-red-400" strokeWidth={2.5} />
                      <span className="text-sm font-bold tracking-wide text-white">
                        Quá trình bị gián đoạn
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Pipeline Steps (Scrollable if necessary) */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden rounded-[2rem] lg:pl-4">
          
          {/* Pipeline steps wrapper */}
          <div className="flex-1 rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Brain className="h-4 w-4" strokeWidth={2.5} />
              Tiến trình phân tích
            </h2>

            <div className="relative space-y-2">
              {/* Vertical Track Line */}
              <div className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-slate-100" />

              {PIPELINE_STEPS.map((step, index) => {
                const status = stepStatuses[step.id];
                const isActive = index === currentStepIndex && globalStatus === "running";
                const isDone = status === "done";
                const isError = status === "error";
                const isIdle = status === "idle";

                return (
                  <div
                    key={step.id}
                    className={`relative z-10 flex items-start gap-4 rounded-2xl p-3 sm:p-4 transition-all duration-500 ${
                      isActive
                        ? "bg-[#245A34]/5 shadow-[0_0_20px_rgba(36,90,52,0.05)] ring-1 ring-[#245A34]/20"
                        : isDone
                          ? "bg-transparent hover:bg-slate-50/50"
                          : isError
                            ? "bg-red-50 ring-1 ring-red-200"
                            : "bg-transparent opacity-60"
                    }`}
                  >
                    {/* Step icon / status indicator */}
                    <div
                      className={`relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
                        isActive
                          ? "bg-[#245A34] text-white shadow-lg shadow-[#245A34]/30 scale-110"
                          : isDone
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                            : isError
                              ? "bg-red-100 text-red-600 ring-1 ring-red-200"
                              : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 animate-ping rounded-2xl border-2 border-[#245A34] opacity-20" />
                      )}
                      {isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                      ) : isDone ? (
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                      ) : isError ? (
                        <XCircle className="h-5 w-5" strokeWidth={2.5} />
                      ) : (
                        <span className="scale-90 opacity-70 transition-transform">{step.icon}</span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-sm font-bold tracking-wide transition-colors ${
                            isActive
                              ? "text-[#245A34]"
                              : isDone
                                ? "text-slate-700"
                                : isError
                                  ? "text-red-700"
                                  : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isIdle && (
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            Bước {index + 1}
                          </span>
                        )}
                        {isDone && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                            Hoàn tất
                          </span>
                        )}
                      </div>
                      
                      <p
                        className={`mt-1 text-[13px] font-medium leading-relaxed transition-colors ${
                          isActive
                            ? "text-[#245A34]/75"
                            : isDone
                              ? "text-slate-500"
                              : isError
                                ? "text-red-500/80"
                                : "text-slate-400"
                        }`}
                      >
                        {step.description}
                      </p>

                      {/* Active progress bar */}
                      {isActive && (
                        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#245A34]/10">
                          <div
                            className="animate-progress h-full rounded-full bg-[#245A34]"
                            style={{
                              animationDuration: `${step.durationMs}ms`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Messages stack at the bottom of the right column */}
          <div className="shrink-0 flex flex-col gap-4">
            {globalStatus === "error" && errorMessage && (
              <div className="rounded-[1.5rem] border border-red-200 bg-white p-5 shadow-sm ring-1 ring-red-50">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-base font-black text-slate-900">Tạo kế hoạch thất bại</p>
                    <p className="mt-1.5 text-sm font-medium text-slate-600">{errorMessage}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          navigate(ROUTES.DASHBOARD.PLANS_GENERATE_PROGRESS, {
                            state: { payload },
                            replace: true,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                      >
                        <RefreshCw className="h-4 w-4" strokeWidth={2.5} />
                        Thử lại
                      </button>
                      <Link
                        to={ROUTES.DASHBOARD.DISEASE_DIAGNOSIS}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                        Quay lại
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {globalStatus === "running" && (
              <div className="flex items-start gap-4 rounded-[1.5rem] border border-amber-200/60 bg-amber-50/50 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 text-amber-600">
                  <span className="text-xl leading-none">⏱️</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-bold tracking-wide text-amber-900">
                    Quá trình có thể mất 30–60 giây
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700/80">
                    Hệ thống đang kiểm tra an toàn. Vui lòng không đóng trang này.
                  </p>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
