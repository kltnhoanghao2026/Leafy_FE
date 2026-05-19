import { useCallback, useState } from "react";
import { X, Upload, Loader2, FileText, Image, File } from "lucide-react";
import toast from "react-hot-toast";
import { fileApi } from "../../../lib/api/fileApi";
import type { CertificateFormEntry } from "../types";

interface CertificateEntryFormProps {
  index: number;
  entry: CertificateFormEntry;
  onChange: (updates: Partial<CertificateFormEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="w-5 h-5" strokeWidth={1.5} />;
  if (fileType.toUpperCase() === "PDF") return <FileText className="w-5 h-5 text-red-500" strokeWidth={1.5} />;
  if (fileType.toUpperCase() === "IMAGE") return <Image className="w-5 h-5 text-blue-500" strokeWidth={1.5} />;
  return <File className="w-5 h-5 text-slate-500" strokeWidth={1.5} />;
}

export function CertificateEntryForm({
  index,
  entry,
  onChange,
  onRemove,
  canRemove,
}: CertificateEntryFormProps) {
  const [uploading, setUploading] = useStateState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const uploaded = await fileApi.uploadFile(file);
        onChange({
          proofUrl: uploaded.id,
          fileType: uploaded.contentType,
          file,
        });
        toast.success("Tải tệp lên thành công!");
      } catch {
        toast.error("Tải tệp thất bại. Vui lòng thử lại.");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [onChange],
  );

  const hasProof = entry.proofUrl.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#245A34] text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Chứng chỉ {index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Xóa chứng chỉ"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Tên chứng chỉ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={entry.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ví dụ: Chứng chỉ Nông nghiệp hữu cơ"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-shadow"
          />
        </div>

        {/* Issued by */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Nơi cấp <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={entry.issuedBy}
            onChange={(e) => onChange({ issuedBy: e.target.value })}
            placeholder="Ví dụ: Bộ Nông nghiệp và Phát triển Nông thôn"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-shadow"
          />
        </div>

        {/* Issue date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Ngày cấp <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={entry.issueDate}
            onChange={(e) => onChange({ issueDate: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-shadow"
          />
        </div>

        {/* Proof file */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Tệp đính kèm (bằng cấp gốc) <span className="text-red-500">*</span>
          </label>

          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              <span className="text-sm font-semibold text-emerald-700">Đang tải lên…</span>
            </div>
          ) : hasProof ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
              {getFileIcon(entry.fileType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-700 truncate">
                  {entry.file?.name ?? "Tệp đã tải lên"}
                </p>
                <p className="text-xs text-emerald-600">{entry.fileType}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange({ proofUrl: "", fileType: undefined, file: null })}
                className="w-7 h-7 rounded-full flex items-center justify-center text-emerald-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Xóa tệp"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
              <Upload className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
              <span className="text-sm font-semibold text-slate-500">
                Nhấn để chọn tệp hoặc kéo thả
              </span>
              <span className="text-xs text-slate-400">
                PDF, PNG, JPG, JPEG — tối đa 10MB
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
