import { useEffect } from "react";
import { useFilePreviewUrl, useMyProfile } from "../../settings/queries";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import { useAuthStore } from "../../../store/authStore";

export function AuthSessionBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { data: profile } = useMyProfile(!!accessToken);
  const { data: avatarUrl } = useFilePreviewUrl(profile?.avatar);

  useEffect(() => {
    if (!accessToken) {
      if (user !== null) {
        setUser(null);
      }
      return;
    }

    if (!profile) {
      return;
    }

    const avatar =
      avatarUrl ||
      (profile.avatar && !isFileServiceReference(profile.avatar)
        ? profile.avatar
        : undefined) ||
      profile.profilePicture ||
      undefined;

    const nextUser = {
      id: profile.userId,
      name: profile.fullName,
      email: profile.email ?? undefined,
      phone: profile.phoneNumber ?? undefined,
      avatar,
    };

    const isSameUser =
      user?.id === nextUser.id &&
      user?.name === nextUser.name &&
      user?.email === nextUser.email &&
      user?.phone === nextUser.phone &&
      user?.avatar === nextUser.avatar;

    if (!isSameUser) {
      setUser(nextUser);
    }
  }, [accessToken, avatarUrl, profile, setUser, user]);

  return null;
}
