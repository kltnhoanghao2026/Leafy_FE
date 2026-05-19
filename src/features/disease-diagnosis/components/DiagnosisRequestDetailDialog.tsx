import type { DiagnoseRequest, DiagnoseResult } from "../types";
import { ModalShell } from "../../../components/ui/ModalShell";
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
