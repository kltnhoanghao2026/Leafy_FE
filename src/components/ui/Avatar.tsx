import React from 'react';
import { isFileServiceReference } from "../../lib/api/fileApi";
import { useFilePreviewUrl } from "../../features/settings/queries";

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The URL or S3 reference of the avatar image */
  src?: string | null;
  /** The name of the user/entity, used for generating initials and alt text */
  name?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** The size of the avatar */
  size?: AvatarSize;
  /** Additional CSS classes for the img element */
  imgClassName?: string;
  /** Fallback background color class */
  fallbackClassName?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-16 h-16 text-xl',
  '3xl': 'w-24 h-24 text-3xl',
};

const initialsFromName = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
};

export function Avatar({
  src,
  name,
  alt,
  size = 'md',
  className = '',
  imgClassName = '',
  fallbackClassName = 'bg-slate-200 text-slate-600',
  ...props
}: AvatarProps) {
  const { data: resolvedUrl } = useFilePreviewUrl(src);
  const finalSrc = isFileServiceReference(src) ? resolvedUrl : src || undefined;
  
  const baseClass = "relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden font-bold";
  const finalClass = `${baseClass} ${sizeClasses[size]} ${fallbackClassName} ${className}`.trim();

  const altText = alt || name || 'Avatar';

  return (
    <div 
      className={finalClass} 
      aria-label={altText} 
      title={name || alt || undefined} 
      {...props}
    >
      {finalSrc ? (
        <img 
          src={finalSrc} 
          alt={altText} 
          className={`w-full h-full object-cover ${imgClassName}`.trim()} 
          onError={(e) => {
            // Hide the broken image and let the fallback div text show underneath
            e.currentTarget.style.display = 'none';
            // Find the span inside the parent and show it
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const span = parent.querySelector('span.avatar-fallback');
              if (span) {
                 (span as HTMLElement).style.display = 'inline';
              }
            }
          }}
        />
      ) : null}
      
      {/* Always render fallback, but hide if image is loading successfully.
          If there's no src, we show it directly. */}
      <span 
        className="avatar-fallback" 
        style={{ display: finalSrc ? 'none' : 'inline' }}
      >
        {initialsFromName(name)}
      </span>
    </div>
  );
}
