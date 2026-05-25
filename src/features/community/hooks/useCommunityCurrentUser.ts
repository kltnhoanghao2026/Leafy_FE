import { isFileServiceReference } from "../../../lib/api/fileApi";
import { useAuthStore } from "../../../store/authStore";
import { useFilePreviewUrl, useMyProfile } from "../../settings/queries";

export const useCommunityCurrentUser = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const storedUser = useAuthStore((state) => state.user);
  const { data: profile } = useMyProfile(!!accessToken);
  const { data: avatarUrl } = useFilePreviewUrl(profile?.avatar);

  const avatar =
    storedUser?.avatar ||
    avatarUrl ||
    (profile?.avatar && !isFileServiceReference(profile.avatar)
      ? profile.avatar
      : undefined) ||
    profile?.profilePicture ||
    undefined;

  return {
    name:
      storedUser?.name ||
      profile?.fullName ||
      storedUser?.email ||
      profile?.email ||
      "Current user",
    avatar,
  };
};
