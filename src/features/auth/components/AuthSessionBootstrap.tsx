import { useEffect } from "react";
import axios from "axios";
import { useMyProfile } from "../../settings/queries";
import { useMyAccount } from "../../settings/queries/useMyAccount";
import { useAuthStore } from "../../../store/authStore";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import { getOrCreateDeviceId } from "../../../lib/clientDevice";

export function AuthSessionBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAccountRole = useAuthStore((state) => state.setAccountRole);
  const setIsInitializing = useAuthStore((state) => state.setIsInitializing);

  const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

  // On mount: attempt a silent token refresh using the HttpOnly cookie.
  // This restores the session after a page reload without exposing the refresh token to JS.
  useEffect(() => {
    if (accessToken) {
      setIsInitializing(false);
      return;
    }

    axios
      .post<ApiEnvelope<{ accessToken: string }>>(
        `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "X-Device-ID": getOrCreateDeviceId(),
          },
          withCredentials: true,
        },
      )
      .then((res) => {
        const token = res.data?.data?.accessToken;
        if (token) {
          setTokens(token);
        }
      })
      .catch(() => {
        // No valid session – user must log in
      })
      .finally(() => {
        setIsInitializing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: profile } = useMyProfile(!!accessToken && !isInitializing);
  const { data: account } = useMyAccount(!!accessToken && !isInitializing);

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
