import { useState } from "react";
import type { DiagnoseRequest, DiagnoseResult } from "../types";
import { ModalShell } from "../../../components/ui/ModalShell";
import {
  formatConfidence,
  getDiseaseLabel,
  isHealthyDisease,
  isSupportedDisease,
} from "../utils/diseaseLabels";
import { useFilePreviewUrl } from "../../settings/queries";
import { DiagnosisPlantSelector, type DiagnosisPlantContext } from "./DiagnosisPlantSelector";
import { useUpdateDiagnosePlantMutation } from "../queries";
import { FileText, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../lib/routes";
import type { PlanGenerationState } from "../../plant-management/plan/pages/PlanGenerationProgressPage";

interface DiagnosisRequestDetailDialogProps {
  request: DiagnoseRequest;
  result?: DiagnoseResult;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function DetailImage({ fileId, alt }: { fileId: string; alt: string }) {
  const { data: presignedUrl, isError } = useFilePreviewUrl(fileId);

  if (isError || !presignedUrl) {
    return (
      <div className="mb-6 h-64 w-full animate-pulse rounded-2xl bg-slate-100" />
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
      <img
        src={presignedUrl}
        alt={alt}
        className="max-h-64 w-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export function DiagnosisRequestDetailDialog({
  request,
  result,
  isLoading = false,
  isError = false,
  onClose,
}: DiagnosisRequestDetailDialogProps) {
  const updatePlantMutation = useUpdateDiagnosePlantMutation();
  const navigate = useNavigate();
  const [plantContext, setPlantContext] = useState<DiagnosisPlantContext>({
    plantId: request.plantId,
  });
  
  const { data: presignedUrl } = useFilePreviewUrl(request.fileId || "");

  const handleSavePlant = async () => {
    try {
      await updatePlantMutation.mutateAsync({
        requestId: request.diagnoseRequestId,
        plantId: plantContext.plantId || null,
      });
      onClose();
    } catch (e) {
      console.error("Failed to update plant", e);
    }
  };

  const isPlantChanged = (plantContext.plantId || "") !== (request.plantId || "");

  const topPrediction = result?.result?.[0];
  const isHealthy = topPrediction ? isHealthyDisease(topPrediction.diseaseName) : true;
  const isSupported = topPrediction ? isSupportedDisease(topPrediction.diseaseName) : false;

  const handleGeneratePlan = () => {
    if (!topPrediction) return;
    const payload: PlanGenerationState = {
      disease_name: topPrediction.diseaseName,
      diseaseLabel: getDiseaseLabel(topPrediction.diseaseName),
      severity_level: topPrediction.severityLevel,
      plantId: plantContext.plantId ?? undefined,
      image_url: presignedUrl ?? undefined,
    };
    onClose();
    navigate(ROUTES.DASHBOARD.PLANS_GENERATE_PROGRESS, { state: { payload } });
  };

  return (
    <ModalShell
      onClose={onClose}
      title="Chi tiết chẩn đoán"
      titleId="diagnosis-detail-title"
      subtitle={
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {request.imageFileName} · {formatDateTime(request.timeStamp)}
        </p>
      }
      maxWidth="sm:max-w-2xl"
    >
      <div className="p-6">
        {request.fileId ? (
          <DetailImage fileId={request.fileId} alt={request.imageFileName} />
        ) : null}
        
        <div className="mb-6">
          <DiagnosisPlantSelector
            value={plantContext}
            onChange={setPlantContext}
            compact={true}
          />
          {isPlantChanged && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => void handleSavePlant()}
                disabled={updatePlantMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-[#245A34] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1a4025] disabled:opacity-50"
              >
                {updatePlantMutation.isPending && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu cây liên kết
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
            <InfoTile label="Loại file" value={request.imageContentType} />
          </div>

          {isLoading ? (
            <div className="mt-5 h-28 animate-pulse rounded-2xl bg-slate-100" />
          ) : null}

          {isError ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              Không tải được kết quả của lượt chẩn đoán này.
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 space-y-3">
              <h3 className="text-base font-black text-slate-900">
                Top predictions
              </h3>
              {result.result.map((item) => {
                const percent = Math.round(item.confidenceScore * 100);
                return (
                  <div key={item.diseaseName}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{getDiseaseLabel(item.diseaseName)}</span>
                      <span className="text-slate-500">
                        {formatConfidence(item.confidenceScore)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#245A34]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              

              {!isHealthy && isSupported && topPrediction && (
                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                  <button
                    onClick={() => handleGeneratePlan()}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1a4025]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Tạo kế hoạch điều trị
                  </button>
                </div>
              )}

              {!isHealthy && !isSupported && topPrediction && (
                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                  <span className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-400">
                    Bệnh chưa được hỗ trợ tạo kế hoạch tự động
                  </span>
                </div>
              )}
            </div>
          ) : null}
      </div>
    </ModalShell>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
