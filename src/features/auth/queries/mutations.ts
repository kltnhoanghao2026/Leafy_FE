import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { authKeys } from "./keys";
import type {
  LoginRequest,
  InitialRegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  RefreshTokenRequest,
  LogoutDeviceRequest,
} from "../schema/requests";

export const useLoginMutation = () =>
  useMutation({
    mutationKey: authKeys.login(),
    mutationFn: (body: LoginRequest) => authApi.login(body),
  });

export const useInitiateRegistrationMutation = () =>
  useMutation({
    mutationKey: authKeys.initiateRegistration(),
    mutationFn: (body: InitialRegisterRequest) =>
      authApi.initiateRegistration(body),
  });

export const useVerifyOtpAndRegisterMutation = () =>
  useMutation({
    mutationKey: authKeys.verifyOtpAndRegister(),
    mutationFn: (body: VerifyOtpRequest) => authApi.verifyOtpAndRegister(body),
  });

export const useResendOtpMutation = () =>
  useMutation({
    mutationKey: authKeys.resendOtp(),
    mutationFn: (body: ResendOtpRequest) => authApi.resendOtp(body),
  });

export const useRefreshAccessTokenMutation = () =>
  useMutation({
    mutationKey: authKeys.refreshAccessToken(),
    mutationFn: (body: RefreshTokenRequest) => authApi.refreshAccessToken(body),
  });

export const useLogoutMutation = () =>
  useMutation({
    mutationKey: authKeys.logout(),
    mutationFn: () => authApi.logout(),
  });

export const useLogoutDeviceMutation = () =>
  useMutation({
    mutationKey: authKeys.logoutDevice(),
    mutationFn: (body: LogoutDeviceRequest) => authApi.logoutDevice(body),
  });

export const useLogoutOtherDevicesMutation = () =>
  useMutation({
    mutationKey: authKeys.logoutOtherDevices(),
    mutationFn: () => authApi.logoutOtherDevices(),
  });
