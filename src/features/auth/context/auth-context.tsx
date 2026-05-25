import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { storage, STORAGE_KEYS } from "../../../lib/local-storage";
import { useAuthStore } from "../../../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "../../settings/queries/keys";
import type { ProfileResponse, UserResponse } from "../../settings/types";
import { profileApi } from "../../settings/api/profile.api";
import { userAccountApi } from "../../settings/api/userAccount.api";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  user: ProfileResponse | null;
  userAccount: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuthUser: (user: ProfileResponse | null) => void;
  logoutLocal: () => void;
  updateUser: (user: ProfileResponse) => void;
  refetchUser: () => Promise<void>;
  loginSuccess: (accessToken: string, refreshToken?: string) => Promise<ProfileResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<ProfileResponse | null>(() => {
    const expiration = storage.get<number>(STORAGE_KEYS.REFRESH_TOKEN_EXPIRATION);
    if (expiration && Date.now() > expiration) {
      useAuthStore.getState().logout();
      storage.remove(STORAGE_KEYS.USER_PROFILE);
      return null;
    }
    return storage.get<ProfileResponse>(STORAGE_KEYS.USER_PROFILE);
  });

  const [userAccount, setUserAccount] = useState<UserResponse | null>(() => {
    return storage.get<UserResponse>(STORAGE_KEYS.USER_ACCOUNT);
  });

  const queryClient = useQueryClient();

  const setAuthUser = useCallback((userData: ProfileResponse | null) => {
    setUser(userData);
    if (userData) {
      storage.set(STORAGE_KEYS.USER_PROFILE, userData);
    } else {
      storage.remove(STORAGE_KEYS.USER_PROFILE);
    }
  }, []);

  const setUserAccountData = useCallback((accountData: UserResponse | null) => {
    setUserAccount(accountData);
    if (accountData) {
      storage.set(STORAGE_KEYS.USER_ACCOUNT, accountData);
    } else {
      storage.remove(STORAGE_KEYS.USER_ACCOUNT);
    }
  }, []);

  const logoutLocal = useCallback(() => {
    console.info("[LogoutDebug] logoutLocal called", {
      hadUser: !!user,
      hadAccessToken: !!useAuthStore.getState().accessToken,
    });
    useAuthStore.getState().logout();
    setUser(null);
    setUserAccountData(null);
    storage.remove(STORAGE_KEYS.USER_PROFILE);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.FCM_TOKEN);
    storage.remove(STORAGE_KEYS.FCM_REGISTERED_USER_ID);
    queryClient.clear();
  }, [queryClient, user, setUserAccountData]);

  const updateUser = useCallback((userData: ProfileResponse) => {
    setUser(userData);
    storage.set(STORAGE_KEYS.USER_PROFILE, userData);
  }, []);

  const refetchUser = useCallback(async () => {
    if (!useAuthStore.getState().accessToken) return;
    try {
      const rawUser = await queryClient.fetchQuery({
        queryKey: profileKeys.me(),
        queryFn: () => profileApi.getMyProfile().then((r) => r.data.data),
      });
      if (rawUser) {
        setAuthUser(rawUser);
      }

      // Also refetch user account for role info
      const rawAccount = await queryClient.fetchQuery({
        queryKey: ["account"],
        queryFn: () => userAccountApi.getMyAccount().then((r) => r.data.data),
      });
      if (rawAccount) {
        setUserAccountData(rawAccount);
      }
    } catch (error) {
      console.error("[Auth] Error refetching user:", error);
    }
  }, [setAuthUser, setUserAccountData, queryClient]);

  const loginSuccess = useCallback(
    async (accessToken: string, refreshToken?: string): Promise<ProfileResponse> => {
      useAuthStore.getState().setTokens(accessToken, refreshToken);
      await queryClient.invalidateQueries({ queryKey: profileKeys.me() });

      const rawUser = await queryClient.fetchQuery({
        queryKey: profileKeys.me(),
        queryFn: () => profileApi.getMyProfile().then((r) => r.data.data),
      });

      if (!rawUser) {
        throw new Error("Failed to fetch user profile after login");
      }

      setAuthUser(rawUser);

      // Fetch user account for role info
      const rawAccount = await queryClient.fetchQuery({
        queryKey: ["account"],
        queryFn: () => userAccountApi.getMyAccount().then((r) => r.data.data),
      });
      if (rawAccount) {
        setUserAccountData(rawAccount);
      }

      return rawUser;
    },
    [setAuthUser, setUserAccountData, queryClient]
  );

  const isAdmin = userAccount?.role === "ADMIN";

  const value: AuthContextType = {
    user,
    userAccount,
    isAuthenticated: !!useAuthStore.getState().accessToken,
    isAdmin,
    setAuthUser,
    logoutLocal,
    updateUser,
    refetchUser,
    loginSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
