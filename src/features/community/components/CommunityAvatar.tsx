import { Avatar } from "../../../components/ui/Avatar";

interface CommunityAvatarProps {
  source?: string | null;
  name?: string | null;
  alt: string;
  className?: string;
}

export function CommunityAvatar({
  source,
  name,
  alt,
  className,
}: CommunityAvatarProps) {
  return (
    <Avatar
      src={source}
      name={name}
      alt={alt}
      className={className}
      // If no size is specified via className (e.g., w-10), we can just let Avatar handle it or set a custom size. 
      // CommunityAvatar often relied on parent providing w-10 h-10 or similar in className, 
      // so we use size "md" as default but className overrides it.
      size="md"
    />
  );
}
