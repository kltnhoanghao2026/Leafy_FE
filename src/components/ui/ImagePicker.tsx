import { useCallback, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { fileApi, isFileServiceReference } from "../../lib/api/fileApi";
import { useFilePreviewUrl } from "../../features/settings/queries";

interface ImagePickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  /** Max number of files allowed. Default: 8 */
  max?: number;
  /** Accept MIME types. Default: "image/*,video/*" */
  accept?: string;
  label?: string;
  hint?: string;
  /** Extra Tailwind classes for the container */
  className?: string;
}

export function ImagePicker({
  value,
  onChange,
  max = 8,
  accept = "image/*,video/*",
  label,
  hint,
  className,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;

      const remaining = max - value.length;
      if (remaining <= 0) {
        setUploadError(`Tối đa ${max} tệp được phép.`);
        e.target.value = "";
        return;
      }

      const toUpload = files.slice(0, remaining);
      setUploadError(null);
      const tempId = `__uploading-${Date.now()}__`;
      setUploadingId(tempId);

      try {
        const newIds = await Promise.all(
          toUpload.map((file) =>
            fileApi.uploadFile(file).then((r) => r.id),
          ),
        );
        onChange([...value, ...newIds]);
      } catch {
        setUploadError("Tải tệp thất bại. Vui lòng thử lại.");
      } finally {
        setUploadingId(null);
        e.target.value = "";
      }
    },
    [max, value, onChange],
  );

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={className}>
      {label && (
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      {hint && (
        <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
      )}

      {uploadError && (
        <p className="mt-1.5 text-xs font-bold text-red-500">{uploadError}</p>
      )}

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {value.map((fileId, idx) => (
            <FileThumbnail
              key={fileId}
              fileId={fileId}
              onRemove={() => remove(idx)}
            />
          ))}

          {uploadingId && (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      )}

      {value.length < max && !uploadingId && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-500 hover:border-[#245A34] hover:text-[#245A34]"
        >
          <Upload className="h-4 w-4" />
          Thêm ảnh / video
        </button>
      )}
      {value.length < max && uploadingId && (
        <p className="mt-2 text-xs text-slate-400">
          Đang tải lên... vui lòng chờ.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}

interface FileThumbnailProps {
  fileId: string;
  onRemove: () => void;
}

function FileThumbnail({ fileId, onRemove }: FileThumbnailProps) {
  const { data: presignedUrl, isLoading } = useFilePreviewUrl(fileId);

  const src =
    isFileServiceReference(fileId) && presignedUrl
      ? presignedUrl
      : undefined;

  return (
    <div className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-red-400 hover:bg-red-50">
      <a
        href={`/api/files/${fileId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full w-full flex-col items-center justify-center"
        title="Xem file"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        ) : src ? (
          <img
            src={src}
            alt={fileId}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <>
            <ImageIcon className="h-5 w-5 text-slate-300 group-hover:text-[#245A34]" />
            <span className="mt-1 truncate px-1 text-[9px] text-slate-400">
              {fileId.length > 10 ? fileId.slice(-8) : fileId}
            </span>
          </>
        )}
      </a>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 rounded-full bg-white p-0.5 text-slate-400 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
        title="Xóa"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
