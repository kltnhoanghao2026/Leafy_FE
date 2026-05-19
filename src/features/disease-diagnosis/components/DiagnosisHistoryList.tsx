import { Eye, Trash2 } from "lucide-react";
import type { DiagnoseRequest, DiagnoseResult } from "../types";
import {
  formatConfidence,
  getDiseaseLabel,
} from "../utils/diseaseLabels";
import { useFilePreviewUrl } from "../../settings/queries";

interface DiagnosisHistoryListProps {
  requests: DiagnoseRequest[];
  resultByRequestId: Map<string, DiagnoseResult>;
  onView: (request: DiagnoseRequest) => void;
  onDelete: (request: DiagnoseRequest) => void;
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

function DiagnosisImage({ fileId, alt }: { fileId: string; alt: string }) {
  const { data: presignedUrl, isError } = useFilePreviewUrl(fileId);

  if (isError || !presignedUrl) {
    return <div className="h-full w-full bg-slate-100" />;
  }

  return (
    <img
      src={presignedUrl}
      alt={alt}
      className="h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

export function DiagnosisHistoryList({
  requests,
  resultByRequestId,
  onView,
  onDelete,
}: DiagnosisHistoryListProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <h3 className="text-xl font-black text-slate-900">
          Chưa có lịch sử chẩn đoán
        </h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Sau khi upload ảnh và chẩn đoán, kết quả sẽ xuất hiện ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const result = resultByRequestId.get(request.diagnoseRequestId);
        const topPrediction = result?.result?.[0];

        return (
          <article
            key={request.diagnoseRequestId}
            className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {request.fileId ? (
                  <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:block">
                    <DiagnosisImage
                      fileId={request.fileId}
                      alt={request.imageFileName}
                    />
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                    {formatDateTime(request.timeStamp)}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    {request.imageFileName || "Ảnh chẩn đoán"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {topPrediction
                      ? `${getDiseaseLabel(topPrediction.diseaseName)} · ${formatConfidence(topPrediction.confidenceScore)}`
                      : "Chưa tải kết quả"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onView(request)}
                  className="inline-flex items-center rounded-2xl border border-[#245A34] bg-white px-4 py-2.5 text-sm font-bold text-[#245A34] hover:bg-green-50"
                >
                  <Eye className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  Xem chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(request)}
                  className="inline-flex items-center rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" strokeWidth={2.5} />
                  Xóa
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
