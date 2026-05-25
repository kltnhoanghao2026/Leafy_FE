import { FileText, Image, File } from "lucide-react";
import type { CertificateFormEntry } from "../types";

interface WizardReviewCardProps {
  entry: CertificateFormEntry;
  index: number;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="w-4 h-4" strokeWidth={1.5} />;
  if (fileType.toUpperCase() === "PDF")
    return <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />;
  if (fileType.toUpperCase() === "IMAGE")
    return <Image className="w-4 h-4 text-blue-500" strokeWidth={1.5} />;
  return <File className="w-4 h-4 text-slate-500" strokeWidth={1.5} />;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function WizardReviewCard({ entry, index }: WizardReviewCardProps) {
  return (
    <div className="p-5 flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
        {index}
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-bold text-slate-800">{entry.title}</p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold">Nơi cấp:</span> {entry.issuedBy}
        </p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold">Ngày cấp:</span> {formatDate(entry.issueDate)}
        </p>
        {entry.proofUrl && (
          <div className="flex items-center gap-1.5 mt-1">
            {getFileIcon(entry.fileType)}
            <span className="text-xs text-emerald-600 font-semibold">Đã đính kèm</span>
          </div>
        )}
      </div>
    </div>
  );
}
