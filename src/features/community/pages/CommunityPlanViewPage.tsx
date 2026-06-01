import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  FlaskConical,
  Play,
  ShieldAlert,
  Sprout,
  User,
  UserCheck,
} from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { PageErrorState } from "../../../components/ui/PageErrorState";
import {
  useApplyPlanMutation,
  useTreatmentPlanDetail,
} from "../../plant-management";
import { EmbeddedEventList } from "../../plant-management/plan/components/EmbeddedEventList";
import { ApplyPlanDialog } from "../../plant-management/plan/components/ApplyPlanDialog";
import { formatDate } from "../../plant-management/shared/components/displayUtils";

const SEVERITY_COLOR: Record<string, string> = {
  LOW:      "text-green-600 bg-green-50",
  MEDIUM:   "text-amber-600 bg-amber-50",
  HIGH:     "text-orange-600 bg-orange-50",
  CRITICAL: "text-red-600 bg-red-50",
};

export function CommunityPlanViewPage() {
  const { planId = "" } = useParams();
  const [applyOpen, setApplyOpen] = useState(false);

  const planQuery = useTreatmentPlanDetail(planId);
  const plan = planQuery.data;
  const applyPlan = useApplyPlanMutation();
  const events = plan?.events ?? [];

  if (planQuery.isLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 text-sm font-bold text-slate-500">
        Đang tải kế hoạch...
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <PageErrorState
        title="Không tải được kế hoạch điều trị."
        onRetry={() => void planQuery.refetch()}
      />
    );
  }

  const applyCountNum = plan.applyCount ?? 0;
  const statusLabel = applyCountNum > 0 ? `${applyCountNum} áp dụng` : "Chưa áp dụng";
  const statusStyle = applyCountNum > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200";
  const severityStyle = plan.severityLevel
    ? (SEVERITY_COLOR[plan.severityLevel.toUpperCase()] ?? "text-slate-600 bg-slate-50")
    : "";
  const confidencePct = plan.confidenceScore != null ? Math.round(plan.confidenceScore * 100) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={ROUTES.DASHBOARD.COMMUNITY}
            className="inline-flex items-center text-sm font-bold text-[#245A34] hover:underline"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại cộng đồng
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-black tracking-tight text-slate-900">
              {plan.planName || plan.diseaseName || "Kế hoạch điều trị"}
            </h1>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${statusStyle}`}>
              {statusLabel}
            </span>
            {plan.urgency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-black text-orange-700">
                <Clock className="w-3 h-3" strokeWidth={2.5} />
                {plan.urgency}
              </span>
            )}
          </div>
          {plan.diseaseName && plan.planName && plan.diseaseName !== plan.planName && (
            <p className="mt-1 text-sm font-semibold text-slate-500 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              Bệnh: {plan.diseaseName}
            </p>
          )}
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Chia sẻ từ cộng đồng · Tạo lúc {formatDate(plan.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Read-only badge */}
          <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-500">
            Chỉ xem
          </span>
          <button
            type="button"
            onClick={() => setApplyOpen(true)}
            className="inline-flex items-center rounded-2xl border border-[#245A34] bg-green-50 px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-100"
          >
            <Play className="mr-2 h-4 w-4" />
            Áp dụng kế hoạch
          </button>
        </div>
      </header>

      {/* Notice banner */}
      <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-5 py-3 flex items-center gap-3">
        <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2} />
        <p className="text-sm font-semibold text-blue-800">
          Đây là kế hoạch điều trị được chia sẻ từ cộng đồng. Bạn có thể xem chi tiết và áp dụng vào vườn của mình, nhưng không thể chỉnh sửa kế hoạch này.
        </p>
      </div>

      {/* Question */}
      {plan.question && (
        <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50 px-6 py-4 flex gap-3">
          <Bot className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">Câu hỏi gốc</p>
            <p className="text-sm font-semibold leading-relaxed text-amber-900">{plan.question}</p>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Key metrics */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Thông tin chính</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</p>
                <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-black ${statusStyle}`}>{statusLabel}</span>
              </div>
              {confidencePct != null && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Độ tin cậy</p>
                  <div className="mt-2">
                    <p className="text-sm font-black text-slate-800 mb-1">{confidencePct}%</p>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-[#245A34]" style={{ width: `${confidencePct}%` }} />
                    </div>
                  </div>
                </div>
              )}
              {plan.severityLevel && (
                <div className={`rounded-2xl p-4 ${severityStyle}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mức độ nghiêm trọng</p>
                  <p className="mt-1 text-sm font-black">{plan.severityLevel}</p>
                </div>
              )}
              {plan.estimatedCost && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" strokeWidth={2.5} />Chi phí
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{plan.estimatedCost}</p>
                </div>
              )}
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đã áp dụng</p>
                <p className="mt-1 text-sm font-black text-slate-800">{plan.applyCount ?? 0} lần</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Số sự kiện</p>
                <p className="mt-1 text-sm font-black text-slate-800">{plan.events?.length ?? events.length}</p>
              </div>
            </div>
          </section>

          {/* Safety / inputs / success */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Vật tư & An toàn</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <FlaskConical className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vật tư cần có</p>
                </div>
                {plan.requiredInputs?.length ? (
                  <ul className="space-y-1">
                    {plan.requiredInputs.map((inp, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm font-semibold text-slate-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#245A34] shrink-0" />
                        {inp}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm font-semibold text-slate-400 italic">Chưa cập nhật</p>}
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Cảnh báo an toàn</p>
                </div>
                {plan.safetyWarnings?.length ? (
                  <ul className="space-y-1">
                    {plan.safetyWarnings.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm font-semibold text-red-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2.5} />
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm font-semibold text-red-400 italic">Kiểm tra thực tế trước khi áp dụng.</p>}
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Dấu hiệu thành công</p>
                </div>
                <p className="text-sm font-semibold text-green-800">
                  {plan.successIndicators || <span className="italic text-green-400">Chưa cập nhật</span>}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-6">
          {/* Scope */}
          <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-4">Thông tin áp dụng</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <Sprout className="w-4 h-4 text-[#245A34] shrink-0" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đã áp dụng</p>
                  <p className="text-sm font-bold text-slate-800">{applyCountNum} lần</p>
                </div>
              </div>
            </div>
          </section>

          {/* Author info */}
          {(plan.ownerInfo || plan.creatorInfo || plan.sourceType === 'RAG_GEN') && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Người tạo
              </h2>
              <div className="space-y-3">
                {plan.ownerInfo && (
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    {plan.ownerInfo.avatar
                      ? <img src={plan.ownerInfo.avatar} alt={plan.ownerInfo.fullName ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><User className="w-4 h-4" strokeWidth={2.5} /></div>
                    }
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-slate-800">{plan.ownerInfo.fullName ?? "Nông dân"}</p>
                        {plan.ownerInfo.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chủ kế hoạch</p>
                    </div>
                  </div>
                )}
                {plan.sourceType === 'RAG_GEN' ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-indigo-800">
                      <Bot className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-indigo-900">Leafy AI</p>
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-indigo-600" strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Trợ lý AI</p>
                    </div>
                  </div>
                ) : plan.creatorInfo && plan.creatorInfo.id !== plan.ownerInfo?.id && (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                    {plan.creatorInfo.avatar
                      ? <img src={plan.creatorInfo.avatar} alt={plan.creatorInfo.fullName ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-emerald-800"><UserCheck className="w-4 h-4" strokeWidth={2.5} /></div>
                    }
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-bold text-emerald-900">{plan.creatorInfo.fullName ?? "Chuyên gia"}</p>
                        {plan.creatorInfo.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />}
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Chuyên gia tư vấn</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* AI source */}
          {plan.sourceType === 'RAG_GEN' && (
            <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-slate-400" strokeWidth={2} />
                Tài liệu & Nguồn tham khảo AI
              </h2>
              <div className="space-y-4 text-sm">
                {plan.sourceDocuments && plan.sourceDocuments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Tài liệu chuyên môn ({plan.sourceDocuments.length})
                    </h3>
                    <div className="space-y-2">
                      {plan.sourceDocuments.map((doc, idx) => (
                        <div key={idx} className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                          <p className="font-bold text-slate-800 text-sm mb-1">{doc.title || doc.filename}</p>
                          {doc.contentSnippet && (
                            <p className="text-xs text-slate-500 line-clamp-2">{doc.contentSnippet}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {plan.webSearchResults && plan.webSearchResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 mt-4">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Tìm kiếm Web ({plan.webSearchResults.length})
                    </h3>
                    <div className="space-y-2">
                      {plan.webSearchResults.map((res, idx) => (
                        <a 
                          key={idx} 
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-bold text-indigo-900 text-sm group-hover:underline">{res.title}</p>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          </div>
                          {res.snippet && (
                            <p className="text-xs text-slate-500 line-clamp-2">{res.snippet}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2 truncate font-mono">{res.url}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!plan.sourceDocuments || plan.sourceDocuments.length === 0) && (!plan.webSearchResults || plan.webSearchResults.length === 0) && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Nguồn nội bộ</p>
                    <p className="font-bold text-slate-700">{plan.source || <span className="italic text-slate-400">Không rõ</span>}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Apply CTA */}
          <div className="rounded-[1.75rem] border border-[#245A34]/20 bg-green-50 p-5">
            <p className="text-sm font-black text-[#245A34] mb-1">Muốn áp dụng kế hoạch này?</p>
            <p className="text-xs font-semibold text-slate-500 mb-4">Chọn vườn và ngày bắt đầu để tạo lịch chăm sóc từ kế hoạch này.</p>
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1b4528] transition-colors"
            >
              <Play className="mr-2 h-4 w-4" />
              Áp dụng ngay
            </button>
          </div>
        </div>
      </div>

      {/* Events list */}
      <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900 mb-1">
          Lịch chăm sóc ({events.length})
        </h2>
        <p className="mb-5 text-sm font-semibold text-slate-400">Các sự kiện trong kế hoạch này</p>

        <EmbeddedEventList events={events} />
      </section>

      {/* Apply dialog */}
      {applyOpen && (
        <ApplyPlanDialog
          plan={plan}
          isSubmitting={applyPlan.isPending}
          onClose={() => setApplyOpen(false)}
          onSubmit={(payload) =>
            void applyPlan.mutateAsync({ planId: plan.id, payload }).then(() => setApplyOpen(false))
          }
        />
      )}
    </div>
  );
}

export default CommunityPlanViewPage;
