import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  File as FileIcon,
  Calendar,
  Building2,
  X,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import type { CertificateDto } from "../types";
import { usePresignedUrl } from "./certificates.queries";
import {
  FileTypeIcon,
  fileTypeLabel,
  fileTypeBadgeStyle,
  resolveFileType,
  formatDate,
} from "./fileTypeHelpers";

export function DocumentViewerModal({
  cert,
  onClose,
}: {
  cert: CertificateDto;
  onClose: () => void;
}) {
  const {
    data: presignedUrl,
    isLoading,
    isError,
  } = usePresignedUrl(cert.proofFileId);

  const viewUrl = presignedUrl ?? cert.proofUrl;
  const type = resolveFileType(cert.fileType, viewUrl);

  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`flex overflow-hidden shadow-2xl transition-all duration-200 ${
          isMaximized
            ? "w-full h-full rounded-none"
            : "w-full max-w-6xl max-h-[92vh] rounded-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: document viewer ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-slate-900 flex flex-col">
          {/* Viewer toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/60 shrink-0">
            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                title="Mở tab mới"
              >
                <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
              </a>
            )}
            <button
              onClick={() => setIsMaximized((v) => !v)}
              className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              title={isMaximized ? "Thu nhỏ" : "Phóng to"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Maximize2 className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
            <span className="ml-auto text-xs text-slate-500 truncate">
              {cert.title}
            </span>
          </div>

          {/* Viewer body */}
          <div className="flex-1 overflow-hidden flex items-center justify-center">
            {isLoading && (
              <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            )}

            {isError && !viewUrl && (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <AlertCircle className="w-10 h-10" strokeWidth={1.5} />
                <p className="text-sm">Không thể tải liên kết tài liệu</p>
              </div>
            )}

            {!isLoading && viewUrl && type === "PDF" && (
              <div className="w-full h-full">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={viewUrl}
                    defaultScale={SpecialZoomLevel.PageWidth}
                  />
                </Worker>
              </div>
            )}

            {!isLoading && viewUrl && type === "IMAGE" && (
              <img
                src={viewUrl}
                alt="Bằng chứng"
                className="max-w-full max-h-full rounded-lg object-contain shadow-lg"
              />
            )}

            {!isLoading && viewUrl && type === "DOCUMENT" && (
              <div className="w-full h-full">
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`}
                  title="Xem tài liệu"
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {!isLoading && viewUrl && type === "OTHER" && (
              <div className="flex flex-col items-center gap-4 text-slate-400">
                <FileIcon className="w-14 h-14" strokeWidth={1} />
                <p className="text-sm">Không thể xem trước loại tệp này</p>
                <a
                  href={viewUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" strokeWidth={2.5} />
                  Tải về
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: certificate info panel ──────────────────────────────── */}
        <div className="w-72 shrink-0 bg-white flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-700">
              Thông tin chứng chỉ
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Loại tài liệu
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${fileTypeBadgeStyle(cert.fileType)}`}
              >
                <FileTypeIcon fileType={cert.fileType} />
                {fileTypeLabel(cert.fileType)}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Tên chứng chỉ
              </p>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {cert.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Cơ quan cấp
              </p>
              <div className="flex items-start gap-2">
                <Building2
                  className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm text-slate-700 leading-snug">
                  {cert.issuedBy}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Ngày cấp
              </p>
              <div className="flex items-center gap-2">
                <Calendar
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  strokeWidth={2}
                />
                <p className="text-sm text-slate-700">
                  {formatDate(cert.issueDate)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Trạng thái
              </p>
              {cert.expired ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 ring-1 ring-red-200">
                  <XCircle className="w-3 h-3" strokeWidth={2.5} />
                  Đã hết hạn
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                  Còn hiệu lực
                </span>
              )}
            </div>

            {cert.proofFileId && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  File ID
                </p>
                <p className="text-xs text-slate-400 font-mono break-all">
                  {cert.proofFileId}
                </p>
              </div>
            )}
          </div>

          {/* Panel footer */}
          {viewUrl && (
            <div className="px-5 py-3.5 border-t border-slate-100">
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                Mở trong tab mới
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
