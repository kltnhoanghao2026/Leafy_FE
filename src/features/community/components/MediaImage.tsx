import { ImageOff, Loader2 } from "lucide-react";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import { useFilePreviewUrl } from "../../settings/queries";

interface MediaImageProps {
  source: string;
  alt: string;
  className?: string;
}

export function MediaImage({ source, alt, className }: MediaImageProps) {
  const { data: resolvedUrl, isLoading, isError } = useFilePreviewUrl(source);
  const src = isFileServiceReference(source) ? resolvedUrl : source;

  if (isFileServiceReference(source) && isLoading) {
    return (
      <div
        aria-label="Loading media attachment"
        className="flex h-52 w-full items-center justify-center bg-slate-100"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#245A34]" />
      </div>
    );
  }

  if (!src || isError) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500">
        <ImageOff className="h-6 w-6" strokeWidth={2.5} />
        <span className="text-sm font-bold">Media unavailable</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
