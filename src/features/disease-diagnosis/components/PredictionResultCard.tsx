import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { DiseasePrediction, PredictResponse } from "../types";
import {
  formatConfidence,
  getDiseaseLabel,
  isHealthyDisease,
} from "../utils/diseaseLabels";

interface PredictionResultCardProps {
  result: PredictResponse;
  onGeneratePlan?: (prediction: DiseasePrediction) => void;
  isGeneratingPlan?: boolean;
}

const sortPredictions = (items: DiseasePrediction[]) =>
  [...items].sort((a, b) => b.confidenceScore - a.confidenceScore);

export function PredictionResultCard({
  result,
  onGeneratePlan,
  isGeneratingPlan,
}: PredictionResultCardProps) {
  const predictions = sortPredictions(result.predictions ?? []);
  const topPrediction = predictions[0];
  const isHealthy = isHealthyDisease(topPrediction?.className);
  const Icon = isHealthy ? CheckCircle2 : AlertTriangle;

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`rounded-2xl p-3 ${
              isHealthy
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Kết quả dự đoán
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              {getDiseaseLabel(topPrediction?.className)}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Độ tin cậy: {formatConfidence(topPrediction?.confidenceScore)}
            </p>
          </div>
        </div>
      </div>

      <p
        className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
          isHealthy
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {isHealthy
          ? "Lá cây có dấu hiệu khỏe mạnh. Tiếp tục theo dõi định kỳ."
          : "Phát hiện dấu hiệu bệnh. Kết quả chỉ mang tính hỗ trợ, cần kiểm tra thực tế trước khi xử lý."}
      </p>

      <div className="mt-6 space-y-3">
        {predictions.map((prediction) => {
          const percent = Math.max(
            0,
            Math.min(100, Math.round(prediction.confidenceScore * 100)),
          );

          return (
            <div key={prediction.className}>
              <div className="flex items-center justify-between gap-3 text-sm font-bold">
                <span className="text-slate-700">
                  {getDiseaseLabel(prediction.className)}
                </span>
                <span className="text-slate-500">{percent}%</span>
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
      </div>

      {!isHealthy && onGeneratePlan && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={!topPrediction || isGeneratingPlan}
            onClick={() => {
              if (topPrediction) onGeneratePlan?.(topPrediction);
            }}
            className="rounded-2xl bg-[#245A34] px-5 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 flex justify-center items-center"
          >
            {isGeneratingPlan ? "Đang tạo kế hoạch..." : "Tạo kế hoạch điều trị"}
          </button>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
        Model: {result.modelName || "Không rõ"} · Thời gian xử lý:{" "}
        {result.processingTimeMs != null
          ? `${Math.round(result.processingTimeMs)}ms`
          : "Không rõ"}
      </div>
    </section>
  );
}
