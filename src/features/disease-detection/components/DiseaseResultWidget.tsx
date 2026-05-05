import { ScanSearch, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import type { PredictionResponse } from "../api/diseaseDetection.api";

const CLASS_TRANSLATIONS: Record<string, string> = {
  healthy: "Lá khỏe mạnh",
  miner: "Bệnh sâu rệp/vẽ bùa",
  phoma: "Bệnh khô cành",
  red_spider_mite: "Bệnh nhện đỏ",
  rust: "Bệnh rỉ sắt",
};

const translateClassName = (className: string) => {
  return CLASS_TRANSLATIONS[className.toLowerCase()] || className;
};

interface DiseaseResultWidgetProps {
  predictionResult: PredictionResponse;
  onClear: () => void;
}

export function DiseaseResultWidget({ predictionResult, onClear }: DiseaseResultWidgetProps) {
  const sorted = [...predictionResult.predictions].sort((a, b) => b.confidenceScore - a.confidenceScore);
  const topPrediction = sorted[0];

  if (!topPrediction) {
    return (
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Không nhận diện được bệnh. Vui lòng thử lại với ảnh rõ nét hơn.</p>
      </div>
    );
  }

  const { className, confidenceScore } = topPrediction;
  const isHealthy = className.toLowerCase() === "healthy";

  return (
    <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <h3 className="text-lg font-bold text-slate-800 mb-4 inline-flex items-center gap-2">
        <ScanSearch className="w-5 h-5 text-emerald-600" />
        Kết quả chẩn đoán chồi lá
      </h3>

      <div className={`border rounded-3xl p-6 ${isHealthy ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isHealthy ? "bg-emerald-100" : "bg-red-100"}`}>
              {isHealthy ? (
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wider ${isHealthy ? "text-emerald-700" : "text-red-700"}`}>
                Dự đoán cao nhất
              </p>
              <h4 className={`text-2xl font-black md:text-3xl ${isHealthy ? "text-emerald-900" : "text-red-900"}`}>
                {translateClassName(className)}
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-sm text-slate-500 font-medium">Độ tin cậy</span>
            <span className="text-3xl font-extrabold text-slate-800">{Math.round(confidenceScore * 100)}%</span>
          </div>
        </div>

        {!isHealthy && (
          <div className="mt-6 pt-6 border-t border-red-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-red-800">
              Hãy tham khảo trợ lý AI để có phác đồ điều trị kịp thời.
            </p>
            <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-colors w-full sm:w-auto">
              Hỏi AI Cách Điều Trị
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest pl-1">
            Phân tích phụ
          </p>
          {sorted.slice(1, 4).map((pred, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
              <span className="font-medium text-slate-700 text-sm md:text-base">{translateClassName(pred.className)}</span>
              <span className="text-sm font-bold text-slate-500">{Math.round(pred.confidenceScore * 100)}%</span>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={onClear}
        className="mt-6 w-full flex justify-center py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
      >
        Tải ảnh khác lên
      </button>
    </div>
  );
}
