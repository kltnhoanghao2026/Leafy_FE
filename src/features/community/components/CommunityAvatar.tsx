import { isFileServiceReference } from "../../../lib/api/fileApi";
import { useFilePreviewUrl } from "../../settings/queries";

interface CommunityAvatarProps {
  source?: string | null;
  name?: string | null;
  alt: string;
  className?: string;
}

const initialsFromName = (name?: string | null) => {
  if (!name) {
    return "U";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
};

export function CommunityAvatar({
  source,
  name,
  alt,
  className,
}: CommunityAvatarProps) {
  const { data: resolvedUrl } = useFilePreviewUrl(source);
  const src = isFileServiceReference(source) ? resolvedUrl : source || undefined;

  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }

  return (
    <div
      aria-label={alt}
      title={name || alt}
      className={`${className || ""} flex items-center justify-center bg-slate-200 text-slate-600`}
    >
      <span className="text-sm font-black">{initialsFromName(name)}</span>
    </div>
  );
}
