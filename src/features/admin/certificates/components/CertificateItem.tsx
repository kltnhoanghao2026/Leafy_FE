import { useState } from "react";
import {
  Building2,
  Calendar,
  Maximize2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { CertificateDto } from "../../types";
import {
  FileTypeIcon,
  fileTypeIconBg,
  fileTypeLabel,
  resolveFileType,
  formatDate,
  type KnownFileType,
} from "./fileTypeHelpers";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { usePresignedUrl } from "../certificates.queries";
import { Viewer, Worker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

/** Renders the proof content (no wrapper, no buttons — parent owns those). */
function ProofContent({
  cert,
  onExpand,
}: {
  cert: CertificateDto;
  onExpand: () => void;
}) {
  const {
    data: presignedUrl,
    isLoading,
    isError,
  } = usePresignedUrl(cert.proofFileId);
  const url = presignedUrl ?? cert.proofUrl;
  const type = (cert.fileType as KnownFileType) ?? "OTHER";

  if (isLoading) {
    return <div className="h-44 bg-slate-100 animate-pulse" />;
  }

  if ((isError || !url) && !cert.proofUrl) {
    return (
      <div className="h-16 flex items-center justify-center gap-2 text-xs text-red-500 bg-red-50">
        <AlertCircle className="w-4 h-4" strokeWidth={2} />
        Không thể tải xem trước
      </div>
    );
  }

  const resolvedUrl = url!;

  if (type === "IMAGE") {
    return (
      <img
        src={resolvedUrl}
        alt="Xem trước bằng chứng"
        className="w-full max-h-56 object-contain bg-slate-100 cursor-zoom-in"
        onClick={onExpand}
      />
    );
  }

  if (type === "PDF") {
    return (
      <div className="h-56 overflow-hidden cursor-pointer" onClick={onExpand}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={resolvedUrl}
            defaultScale={SpecialZoomLevel.PageWidth}
          />
        </Worker>
      </div>
    );
  }

  if (type === "DOCUMENT") {
    return (
      <div className="relative h-56 group">
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`}
          title="Xem trước tài liệu"
          className="w-full h-full border-0"
        />
        <button
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          onClick={onExpand}
          aria-label="Mở tài liệu"
        >
          <Maximize2 className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div className="h-16 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50">
      <FileTypeIcon fileType={cert.fileType} />
      Không hỗ trợ xem trước loại tệp này
    </div>
  );
}

export function CertificateItem({
  cert,
  index,
}: {
  cert: CertificateDto;
  index: number;
}) {
  const [showViewer, setShowViewer] = useState(false);
  const hasProof = !!cert.proofFileId || !!cert.proofUrl;
  const resolvedType = resolveFileType(cert.fileType, cert.proofUrl);
  const label = fileTypeLabel(resolvedType);

  return (
    <div className="py-4">
      {/* ── Meta row ───────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Index badge */}
        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 select-none">
          {index}
        </div>

        <div
          className={`w-7 h-7 rounded-lg ${fileTypeIconBg(resolvedType)} flex items-center justify-center shrink-0`}
        >
          <FileTypeIcon fileType={resolvedType} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {cert.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="w-3 h-3" strokeWidth={2} />
              {cert.issuedBy}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3 h-3" strokeWidth={2} />
              {formatDate(cert.issueDate)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Proof preview panel ─────────────────── */}
      {hasProof && (
        <div className="mt-3 ml-8 rounded-xl overflow-hidden border border-slate-200 bg-white">
          {/* Panel header bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <FileTypeIcon fileType={resolvedType} />
              Bằng chứng · {label}
            </span>

            <div className="flex items-center gap-1">
              {cert.proofUrl && (
                <a
                  href={cert.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded text-slate-400 hover:text-emerald-700 transition-colors"
                  title="Mở liên kết ngoài"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                </a>
              )}
              <button
                onClick={() => setShowViewer(true)}
                className="p-1 rounded text-slate-400 hover:text-emerald-700 transition-colors"
                title="Xem toàn màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Proof content */}
          <ProofContent cert={cert} onExpand={() => setShowViewer(true)} />
        </div>
      )}

      {showViewer && hasProof && (
        <DocumentViewerModal cert={cert} onClose={() => setShowViewer(false)} />
      )}
    </div>
  );
}

/** Resolves the URL (presigned if fileId present, else fallback) then renders the preview. */
export function InlineProofPreview({
  cert,
  onExpand,
}: {
  cert: CertificateDto;
  onExpand: () => void;
}) {
  const {
    data: presignedUrl,
    isLoading,
    isError,
  } = usePresignedUrl(cert.proofFileId);
  const url = presignedUrl ?? cert.proofUrl;
  const type = (cert.fileType as KnownFileType) ?? "OTHER";

  if (isLoading) {
    return (
      <div className="mt-3 h-48 w-full rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
    );
  }

  if ((isError || !url) && !cert.proofUrl) {
    return (
      <div className="mt-3 h-20 w-full rounded-xl border border-red-100 bg-red-50 flex items-center justify-center gap-2 text-xs text-red-500">
        <AlertCircle className="w-4 h-4" strokeWidth={2} />
        Không thể tải xem trước
      </div>
    );
  }

  const resolvedUrl = url!;

  return (
    <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
      {/* expand button */}
      <button
        onClick={onExpand}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        title="Xem toàn màn hình"
      >
        <Maximize2 className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>

      {type === "IMAGE" && (
        <img
          src={resolvedUrl}
          alt="Xem trước bằng chứng"
          className="w-full max-h-56 object-contain bg-slate-100 cursor-zoom-in"
          onClick={onExpand}
        />
      )}

      {type === "PDF" && (
        <div className="h-56 overflow-hidden cursor-pointer" onClick={onExpand}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={resolvedUrl}
              defaultScale={SpecialZoomLevel.PageWidth}
            />
          </Worker>
        </div>
      )}

      {type === "DOCUMENT" && (
        <div className="h-56 pointer-events-none">
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`}
            title="Xem trước tài liệu"
            className="w-full h-full border-0"
          />
          {/* overlay to intercept click and open modal */}
          <button
            className="absolute inset-0 w-full h-full cursor-pointer bg-transparent"
            onClick={onExpand}
            aria-label="Mở tài liệu"
          />
        </div>
      )}

      {type === "OTHER" && (
        <div className="h-20 flex items-center justify-center gap-2 text-xs text-slate-400">
          <FileTypeIcon fileType={cert.fileType} />
          Không hỗ trợ xem trước loại tệp này
        </div>
      )}
    </div>
  );
}
