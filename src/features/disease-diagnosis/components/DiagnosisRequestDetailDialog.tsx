import { X } from "lucide-react";
import type { DiagnoseRequest, DiagnoseResult } from "../types";
import {
  formatConfidence,
  getDiseaseLabel,
} from "../utils/diseaseLabels";

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

export function DiagnosisRequestDetailDialog({
  request,
  result,
  isLoading = false,
  isError = false,
  onClose,
}: DiagnosisRequestDetailDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diagnosis-detail-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 id="diagnosis-detail-title" className="text-xl font-black text-slate-900">
              Chi tiết chẩn đoán
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {request.imageFileName} · {formatDateTime(request.timeStamp)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoTile label="Request ID" value={request.diagnoseRequestId} />
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
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
