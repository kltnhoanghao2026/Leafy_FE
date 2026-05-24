import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useFilePreviewUrl } from '../../../../features/settings/queries';
import { isFileServiceReference } from '../../../../lib/api/fileApi';

interface FileThumbnailProps {
  fileId: string;
}

export function FileThumbnail({ fileId }: FileThumbnailProps) {
  const { data: presignedUrl, isLoading } = useFilePreviewUrl(fileId);

  const src =
    isFileServiceReference(fileId) && presignedUrl
      ? presignedUrl
      : undefined;

  return (
    <a
      href={`/api/files/${fileId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-[#245A34] hover:bg-[#245A34]/5"
    >
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
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
          <ImageIcon className="h-6 w-6 text-slate-300 group-hover:text-[#245A34]" />
          <span className="mt-1 truncate px-1 text-[9px] text-slate-400">
            {fileId.length > 12 ? `${fileId.slice(0, 8)}…` : fileId}
          </span>
        </>
      )}
    </a>
  );
}
