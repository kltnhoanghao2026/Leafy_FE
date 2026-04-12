import { useEffect } from "react";
import { useMyProfile } from "../../settings/queries";
import { useMyAccount } from "../../settings/queries/useMyAccount";
import { useAuthStore } from "../../../store/authStore";

export function AuthSessionBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setAccountRole = useAuthStore((state) => state.setAccountRole);
  const { data: profile } = useMyProfile(!!accessToken);
  const { data: account } = useMyAccount(!!accessToken);

  useEffect(() => {
    if (!accessToken) {
      if (user !== null) {
        setUser(null);
      }
      setAccountRole(null);
      return;
    }

    if (!profile) {
      return;
    }

    const nextUser = {
      id: profile.userId,
      name: profile.fullName,
      email: profile.email ?? undefined,
      phone: profile.phoneNumber ?? undefined,
      avatar: profile.avatar ?? profile.profilePicture ?? undefined,
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
  }, [accessToken, profile, setUser, setAccountRole, user]);

  useEffect(() => {
    if (account?.role) {
      setAccountRole(account.role);
    }
  }, [account, setAccountRole]);

  return null;
}
