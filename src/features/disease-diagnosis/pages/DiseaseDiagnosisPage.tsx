import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { History, Leaf } from "lucide-react";
import { ROUTES } from "../../../lib/routes";
import { ImageUploadPanel } from "../components/ImageUploadPanel";
import {
  DiagnosisPlantSelector,
  type DiagnosisPlantContext,
} from "../components/DiagnosisPlantSelector";
import { PredictionResultCard } from "../components/PredictionResultCard";
import { usePredictDiseaseMutation, usePredictHealth } from "../queries";
import type { DiseasePrediction, PredictResponse } from "../types";
import { validateDiagnosisImage } from "../utils/fileValidation";
import { getDiseaseLabel } from "../utils/diseaseLabels";

const toFriendlyError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : String(error ?? "");
  if (/401|unauthenticated|unauthorized|forbidden/i.test(message)) {
    return "Bạn cần đăng nhập hoặc không có quyền thực hiện chẩn đoán.";
  }
  if (/model|loaded|ready|503/i.test(message)) {
    return "Model chẩn đoán chưa sẵn sàng. Vui lòng thử lại sau.";
  }
  if (/timeout|network|failed/i.test(message)) {
    return "Không kết nối được disease-detection-service. Vui lòng thử lại.";
  }
  return "Chẩn đoán thất bại. Vui lòng kiểm tra ảnh và thử lại.";
};

export function DiseaseDiagnosisPage() {
  const location = useLocation();
  const routeState = location.state as
    | { plantContext?: DiagnosisPlantContext }
    | null;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [plantContext, setPlantContext] = useState<DiagnosisPlantContext>(
    routeState?.plantContext ?? {},
  );
  const previewUrlRef = useRef<string | null>(null);
  const navigate = useNavigate();
  const predictMutation = usePredictDiseaseMutation();
  const healthQuery = usePredictHealth();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const replacePreviewUrl = (nextFile: File | null) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!nextFile) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  };

  const handleFileChange = (nextFile: File | null) => {
    const validationError = validateDiagnosisImage(nextFile);
    setError(validationError);
    setResult(null);
    const acceptedFile = validationError ? null : nextFile;
    setFile(acceptedFile);
    replacePreviewUrl(acceptedFile);
  };

  const handleSubmit = async () => {
    const validationError = validateDiagnosisImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!file) {
      setError("Vui lòng chọn ảnh lá cây trước khi chẩn đoán.");
      return;
    }

    try {
      setError(null);
      const response = await predictMutation.mutateAsync(file);
      if (!response?.predictions?.length) {
        setError("Response chẩn đoán không hợp lệ. Không có kết quả dự đoán.");
        return;
      }
      setResult(response);
    } catch (err) {
      setError(toFriendlyError(err));
    }
  };

  const handleAskAi = (
    prediction: DiseasePrediction,
    predictions: DiseasePrediction[],
  ) => {
    navigate(ROUTES.DASHBOARD.AI_ASSISTANT, {
      state: {
        diseaseContext: {
          diseaseClassName: prediction.className,
          diseaseLabel: getDiseaseLabel(prediction.className),
          confidence: prediction.confidenceScore,
          topPredictions: predictions.map((item) => ({
            className: item.className,
            label: getDiseaseLabel(item.className),
            confidence: item.confidenceScore,
          })),
          ...plantContext,
        },
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[#245A34]">
            Disease detection
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-tight text-slate-900">
            Chẩn đoán bệnh lá cà phê
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-slate-500">
            Tải ảnh lá cây để hệ thống nhận diện bệnh. Kết quả chỉ mang tính hỗ
            trợ, cần kiểm tra thực tế trước khi xử lý.
          </p>
        </div>
        <Link
          to={ROUTES.DASHBOARD.DIAGNOSIS_HISTORY}
          className="inline-flex items-center justify-center rounded-2xl border border-[#245A34] bg-white px-5 py-3 text-sm font-bold text-[#245A34] hover:bg-green-50"
        >
          <History className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Xem lịch sử chẩn đoán
        </Link>
      </header>

      {healthQuery.isError ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Model có thể chưa sẵn sàng. Bạn vẫn có thể thử chẩn đoán, hệ thống sẽ
          báo lỗi nếu backend chưa phục vụ.
        </div>
      ) : healthQuery.data ? (
        <div className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
          <Leaf className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Model đang sẵn sàng
        </div>
      ) : null}

      <ImageUploadPanel
        file={file}
        previewUrl={previewUrl}
        error={error}
        isSubmitting={predictMutation.isPending}
        onFileChange={handleFileChange}
        onSubmit={() => void handleSubmit()}
        onClear={() => {
          setFile(null);
          replacePreviewUrl(null);
          setError(null);
          setResult(null);
        }}
      />

      <DiagnosisPlantSelector
        value={plantContext}
        onChange={setPlantContext}
      />

      {result ? (
        <PredictionResultCard result={result} onAskAi={handleAskAi} />
      ) : null}
    </div>
  );
}

export default DiseaseDiagnosisPage;
