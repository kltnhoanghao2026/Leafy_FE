import { useEffect } from "react";
import axios from "axios";
import { useFilePreviewUrl, useMyProfile } from "../../settings/queries";
import { useMyAccount } from "../../settings/queries/useMyAccount";
import { isFileServiceReference } from "../../../lib/api/fileApi";
import { useAuthStore } from "../../../store/authStore";
import { API_ENDPOINTS } from "../../../lib/routes";
import type { ApiEnvelope } from "../../../shared/types/api";
import { getOrCreateDeviceId } from "../../../lib/clientDevice";
import { getApiBaseUrl } from "../../../lib/apiBaseUrl";

export function AuthSessionBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setAccountRole = useAuthStore((state) => state.setAccountRole);
  const setIsInitializing = useAuthStore((state) => state.setIsInitializing);

  const baseURL = getApiBaseUrl();

  useEffect(() => {
    if (accessToken) {
      setIsInitializing(false);
      return;
    }

    const refreshSession = async () => {
      try {
        const res = await axios.post<ApiEnvelope<{ accessToken: string }>>(
          `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getOrCreateDeviceId(),
            },
            withCredentials: true,
          },
        );

        const token = res.data?.data?.accessToken;
        if (token) {
          setTokens(token);
          return;
        }
      } catch {
        // Fall back below when no valid refresh cookie exists.
      }

      if (!refreshToken) return;

      try {
        const res = await axios.post<
          ApiEnvelope<{ accessToken: string; refreshToken?: string }>
        >(
          `${baseURL}${API_ENDPOINTS.AUTH.REFRESH}/mobile`,
          { refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              "X-Device-ID": getOrCreateDeviceId(),
            },
            withCredentials: true,
          },
        );

        const data = res.data?.data;
        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken ?? refreshToken);
        }
      } catch {
        // No valid session: user must log in.
      }
    };

    refreshSession().finally(() => {
      setIsInitializing(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: profile } = useMyProfile(!!accessToken && !isInitializing);
  const { data: avatarUrl } = useFilePreviewUrl(profile?.avatar);
  const { data: account } = useMyAccount(!!accessToken && !isInitializing);

  useEffect(() => {
    if (!accessToken) {
      console.log(
        "[AuthSessionBootstrap] no accessToken -> clearing user & accountRole",
      );
      if (user !== null) {
        setUser(null);
      }
      setAccountRole(null);
      return;
    }

    if (!profile) {
      console.log(
        "[AuthSessionBootstrap] accessToken present but profile not yet loaded",
      );
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
      profileId: profile.id,
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
  }, [accessToken, avatarUrl, profile, setUser, setAccountRole, user]);

  useEffect(() => {
    console.log(
      `[AuthSessionBootstrap] account effect - role=${account?.role ?? "(no account yet)"}`,
    );
    if (account?.role) {
      console.log(`[AuthSessionBootstrap] setting accountRole -> ${account.role}`);
      setAccountRole(account.role);
    }
  }, [account, setAccountRole]);

  return null;
}
