import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMyProfile } from "../../settings/queries";
import { certificatesMutations } from "../queries/certificates.queries";
import type { CertificateFormEntry, CreateApprovalRequestPayload } from "../types";
import { WizardProgress } from "../components/WizardProgress";
import { CertificateEntryForm } from "../components/CertificateEntryForm";
import { WizardReviewCard } from "../components/WizardReviewCard";
import { WIZARD_STEPS } from "../constants";

const SPECIALTY_OPTIONS = [
  "Nông nghiệp tổng hợp",
  "Bệnh học cây trồng",
  "Quản lý đất & dinh dưỡng",
  "Thủy lợi & tưới tiêu",
  "Cây công nghiệp (cà phê, cao su, tiêu…)",
  "Cây ăn quả",
  "Rau màu & nông sản sạch",
  "Lúa & cây lương thực",
  "Khuyến nông & phát triển nông thôn",
  "Công nghệ sinh học nông nghiệp",
];

// ── Step components ────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const benefits = [
    "Được hiển thị trong danh sách chuyên gia cho nông dân",
    "Nhận yêu cầu tư vấn từ nông dân trên toàn quốc",
    "Được cấp huy hiệu Chuyên gia đã xác minh trên hồ sơ",
    "Truy cập công cụ tư vấn chuyên sâu của Leafy",
  ];
  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#245A34] to-[#10B981] shadow-lg">
          <Sparkles className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Trở thành Chuyên gia Leafy
        </h2>
        <p className="text-slate-600 leading-relaxed">
          Gửi hồ sơ chứng chỉ chuyên môn của bạn để được xác minh và hiển thị
          trong danh sách chuyên gia của cộng đồng nông nghiệp Leafy.
        </p>
      </div>

      {/* What you need */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
            Bạn cần chuẩn bị
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2
                  className="w-4 h-4 text-emerald-600"
                  strokeWidth={2.5}
                />
              </div>
              <p className="text-sm text-slate-700 font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <Award className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-slate-500 leading-relaxed">
          Hồ sơ của bạn sẽ được đội ngũ quản trị viên Leafy xem xét trong vòng{" "}
          <strong className="text-slate-700">3–5 ngày làm việc</strong>.
          Vui lòng đảm bảo các chứng chỉ hợp lệ và rõ ràng.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#245A34] hover:bg-[#1a4226] text-white font-bold text-sm shadow-sm transition-colors"
      >
        Bắt đầu hồ sơ
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function SpecialtyStep({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Chuyên môn của bạn
        </h2>
        <p className="text-slate-600 text-sm">
          Chọn lĩnh vực chuyên môn chính mà bạn muốn được xác minh
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {SPECIALTY_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
              value === option
                ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300"
                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                value === option
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-300"
              }`}
            >
              {value === option && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span
              className={`text-sm font-semibold ${
                value === option ? "text-emerald-800" : "text-slate-700"
              }`}
            >
              {option}
            </span>
          </button>
        ))}
      </div>

      {/* Custom specialty */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Hoặc nhập chuyên môn khác
        </label>
        <input
          type="text"
          value={SPECIALTY_OPTIONS.includes(value) ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ví dụ: Trồng nấm, Nuôi cá…"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-shadow"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          Quay lại
        </button>
        <button
          onClick={onNext}
          disabled={!value.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#245A34] hover:bg-[#1a4226] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors shadow-sm"
        >
          Tiếp tục
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function CertificatesStep({
  certificates,
  onChange,
  onNext,
  onBack,
}: {
  certificates: CertificateFormEntry[];
  onChange: (certs: CertificateFormEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const addCertificate = () => {
    onChange([
      ...certificates,
      {
        title: "",
        issuedBy: "",
        proofUrl: "",
        file: null,
        issueDate: "",
      },
    ]);
  };

  const removeCertificate = (index: number) => {
    onChange(certificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (
    index: number,
    updates: Partial<CertificateFormEntry>,
  ) => {
    onChange(
      certificates.map((cert, i) =>
        i === index ? { ...cert, ...updates } : cert,
      ),
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Chứng chỉ & Bằng cấp
        </h2>
        <p className="text-slate-600 text-sm">
          Thêm ít nhất một chứng chỉ chuyên môn. Bạn có thể thêm nhiều chứng
          chỉ cùng lúc.
        </p>
      </div>

      {/* Certificate list */}
      <div className="space-y-4">
        {certificates.map((cert, index) => (
          <CertificateEntryForm
            key={index}
            index={index}
            entry={cert}
            onChange={(updates) => updateCertificate(index, updates)}
            onRemove={() => removeCertificate(index)}
            canRemove={certificates.length > 1}
          />
        ))}
      </div>

      {/* Add more */}
      <button
        type="button"
        onClick={addCertificate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Thêm chứng chỉ khác
      </button>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          Quay lại
        </button>
        <button
          onClick={onNext}
          disabled={certificates.length === 0 || certificates.some((c) => !c.title.trim() || !c.issuedBy.trim())}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#245A34] hover:bg-[#1a4226] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors shadow-sm"
        >
          Xem lại hồ sơ
          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  proposedSpecialty,
  certificates,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  proposedSpecialty: string;
  certificates: CertificateFormEntry[];
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const certCount = certificates.length;
  const canSubmit =
    proposedSpecialty.trim() &&
    certificates.every(
      (c) =>
        c.title.trim() &&
        c.issuedBy.trim() &&
        c.issueDate &&
        c.proofUrl.trim(),
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Xem lại & Gửi hồ sơ
        </h2>
        <p className="text-slate-600 text-sm">
          Kiểm tra kỹ thông tin trước khi gửi. Bạn không thể sửa sau khi gửi.
        </p>
      </div>

      {/* Specialty summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Star className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chuyên môn đăng ký
          </span>
        </div>
        <div className="p-5">
          <p className="text-sm font-bold text-slate-800">{proposedSpecialty}</p>
        </div>
      </div>

      {/* Certificates summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chứng chỉ ({certCount})
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {certificates.map((cert, idx) => (
            <WizardReviewCard key={idx} entry={cert} index={idx + 1} />
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-xs text-amber-700 leading-relaxed">
          Hồ sơ sẽ được gửi đến đội ngũ quản trị viên để xem xét. Bạn sẽ được
          thông báo khi có kết quả. Không thể chỉnh sửa sau khi gửi.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          Quay lại
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#245A34] hover:bg-[#1a4226] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang gửi…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              Gửi hồ sơ xác minh
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SuccessStep({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-in">
      {/* Confetti-like icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#245A34] flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Hồ sơ đã được gửi!
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Cảm ơn bạn đã gửi hồ sơ xác minh chuyên gia. Đội ngũ quản trị viên
          sẽ xem xét trong vòng{" "}
          <strong className="text-slate-800">3–5 ngày làm việc</strong> và
          thông báo kết quả qua hệ thống thông báo.
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-left space-y-4">
        <h3 className="text-sm font-bold text-slate-700">Quy trình xem xét</h3>
        <div className="space-y-3">
          {[
            {
              icon: <CheckCircle2 className="w-4 h-4" />,
              title: "Đã nhận hồ sơ",
              desc: "Hồ sơ của bạn đang chờ xem xét",
              done: true,
            },
            {
              icon: <Clock className="w-4 h-4" />,
              title: "Đang xem xét",
              desc: "Đội ngũ quản trị đang kiểm tra thông tin",
              done: false,
            },
            {
              icon: <ShieldCheck className="w-4 h-4" />,
              title: "Thông báo kết quả",
              desc: "Bạn sẽ nhận thông báo khi có quyết định",
              done: false,
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{step.title}</p>
                <p className="text-xs text-slate-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#245A34] hover:bg-[#1a4226] text-white font-bold text-sm transition-colors shadow-sm"
      >
        Xem lịch sử hồ sơ
      </button>
    </div>
  );
}

// ── Main wizard page ────────────────────────────────────────────────────────────

export function ApplyAsExpertPage() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const submitMutation = certificatesMutations.useSubmitApprovalRequest();

  const [currentStep, setCurrentStep] = useState(0);
  const [proposedSpecialty, setProposedSpecialty] = useState("");
  const [certificates, setCertificates] = useState<CertificateFormEntry[]>([]);

  const isSuccess = currentStep === WIZARD_STEPS.length - 1;

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!profile?.id) {
      toast.error("Không tìm thấy hồ sơ người dùng.");
      return;
    }

    // Build submission payload — strip local `file` field
    const payload: CreateApprovalRequestPayload = {
      proposedSpecialty: proposedSpecialty.trim(),
      certificates: certificates.map((cert) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, ...rest } = cert;
        return rest;
      }),
    };

    try {
      await submitMutation.mutateAsync({ profileId: profile.id, payload });
      setCurrentStep(WIZARD_STEPS.length - 1); // Go to success step
    } catch {
      toast.error("Gửi hồ sơ thất bại. Vui lòng thử lại.");
    }
  }, [certificates, profile, proposedSpecialty, submitMutation]);

  const handleCloseSuccess = useCallback(() => {
    navigate("/dashboard/profile");
  }, [navigate]);

  const renderStep = () => {
    const props = {
      proposedSpecialty,
      certificates,
      onSubmit: handleSubmit,
      onBack: handleBack,
    };

    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <SpecialtyStep
            value={proposedSpecialty}
            onChange={setProposedSpecialty}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <CertificatesStep
            certificates={certificates}
            onChange={setCertificates}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <ReviewStep
            {...props}
            isSubmitting={submitMutation.isPending}
          />
        );
      case 4:
        return <SuccessStep onClose={handleCloseSuccess} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Hồ sơ xác minh Chuyên gia
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gửi chứng chỉ chuyên môn để trở thành Chuyên gia được xác minh
        </p>
      </div>

      {/* Wizard progress (hidden on success step) */}
      {!isSuccess && (
        <WizardProgress steps={WIZARD_STEPS} currentStep={currentStep} />
      )}

      {/* Step content */}
      <div className="mt-8">{renderStep()}</div>
    </div>
  );
}
