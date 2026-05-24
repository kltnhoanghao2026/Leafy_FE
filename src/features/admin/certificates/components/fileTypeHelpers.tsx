import { FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";

export type KnownFileType = "PDF" | "IMAGE" | "DOCUMENT" | "OTHER";

/**
 * Returns the resolved file type, falling back to URL-based detection when
 * `explicitType` is absent or "OTHER". Strips presigned query params before
 * checking the file extension.
 */
export function resolveFileType(
  explicitType: string | null | undefined,
  url?: string | null,
): KnownFileType {
  if (explicitType && explicitType !== "OTHER") {
    return explicitType as KnownFileType;
  }
  if (url) {
    const path = url.split("?")[0].toLowerCase();
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path)) return "IMAGE";
    if (/\.pdf$/.test(path)) return "PDF";
    if (/\.(docx?|xlsx?|pptx?|odt|ods|odp)$/.test(path)) return "DOCUMENT";
  }
  return "OTHER";
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function fileTypeIconBg(fileType?: string): string {
  switch ((fileType as KnownFileType) ?? "OTHER") {
    case "PDF":
      return "bg-red-50";
    case "IMAGE":
      return "bg-sky-50";
    case "DOCUMENT":
      return "bg-blue-50";
    default:
      return "bg-slate-50";
  }
}

export function fileTypeLabel(fileType?: string): string {
  switch ((fileType as KnownFileType) ?? "OTHER") {
    case "PDF":
      return "PDF";
    case "IMAGE":
      return "Hình ảnh";
    case "DOCUMENT":
      return "Tài liệu văn bản";
    default:
      return "Tệp khác";
  }
}

export function fileTypeBadgeStyle(fileType?: string): string {
  switch ((fileType as KnownFileType) ?? "OTHER") {
    case "PDF":
      return "bg-red-50 text-red-600 ring-red-200";
    case "IMAGE":
      return "bg-sky-50 text-sky-600 ring-sky-200";
    case "DOCUMENT":
      return "bg-blue-50 text-blue-600 ring-blue-200";
    default:
      return "bg-slate-50 text-slate-500 ring-slate-200";
  }
}

export function FileTypeIcon({ fileType }: { fileType?: string }) {
  switch (fileType ?? "OTHER") {
    case "PDF":
      return <FileText className="w-4 h-4 text-red-500" strokeWidth={2} />;
    case "IMAGE":
      return <ImageIcon className="w-4 h-4 text-sky-500" strokeWidth={2} />;
    case "DOCUMENT":
      return <FileText className="w-4 h-4 text-blue-500" strokeWidth={2} />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-400" strokeWidth={2} />;
  }
}
