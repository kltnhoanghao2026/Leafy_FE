import { UploadCloud, X } from "lucide-react";
import { acceptedImageTypes } from "../utils/fileValidation";

interface ImageUploadPanelProps {
  file: File | null;
  previewUrl: string | null;
  error?: string | null;
  isSubmitting?: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function ImageUploadPanel({
  file,
  previewUrl,
  error,
  isSubmitting = false,
  onFileChange,
  onSubmit,
  onClear,
}: ImageUploadPanelProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <label
          htmlFor="diagnosis-image"
          className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-[#245A34] hover:bg-green-50/40"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onFileChange(event.dataTransfer.files.item(0));
          }}
        >
          <UploadCloud className="h-12 w-12 text-[#245A34]" strokeWidth={2.2} />
          <h3 className="mt-4 text-xl font-black text-slate-900">
            Tải ảnh lá cây
          </h3>
          <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">
            Kéo thả ảnh vào đây hoặc bấm để chọn file. Hỗ trợ JPG, PNG, WebP,
            tối đa 10MB.
          </p>
          <input
            id="diagnosis-image"
            type="file"
            aria-label="Tải ảnh lá cây"
            accept={acceptedImageTypes.join(",")}
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.item(0) ?? null)}
          />
        </label>

        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Preview
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {file?.name || "Chưa chọn ảnh"}
              </p>
            </div>
            {file ? (
              <button
                type="button"
                onClick={onClear}
                className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-red-600"
                aria-label="Xóa ảnh"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-white">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview ảnh lá cây"
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="px-6 text-center text-sm font-semibold text-slate-400">
                Ảnh preview sẽ hiển thị tại đây trước khi gửi chẩn đoán.
              </p>
            )}
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              htmlFor="diagnosis-image"
              className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Chọn ảnh khác
            </label>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#245A34] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b432a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Đang chẩn đoán..." : "Chẩn đoán"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
