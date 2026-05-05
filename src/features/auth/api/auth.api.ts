import type { ApiEnvelope } from "../../../shared/types/api";
import type {
  LoginRequest,
  InitialRegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  LogoutDeviceRequest,
} from "../schema/requests";
import type {
  AuthResponse,
  RegistrationInitResponse,
} from "../schema/responses";
import apiClient from "../../../lib/apiClient";
import { API_ENDPOINTS } from "../../../lib/routes";

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<ApiEnvelope<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, body),

  initiateRegistration: (body: InitialRegisterRequest) =>
    apiClient.post<ApiEnvelope<RegistrationInitResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_INIT,
      body,
    ),

  verifyOtpAndRegister: (body: VerifyOtpRequest) =>
    apiClient.post<ApiEnvelope<AuthResponse>>(
      API_ENDPOINTS.AUTH.REGISTER_VERIFY,
      body,
    ),

  resendOtp: (body: ResendOtpRequest) =>
    apiClient.post<ApiEnvelope<string>>(
      API_ENDPOINTS.AUTH.REGISTER_RESEND_OTP,
      body,
    ),

  // WEB: reads HttpOnly refresh cookie; returns only accessToken in body
  refreshAccessToken: () =>
    apiClient.post<ApiEnvelope<AuthResponse>>(API_ENDPOINTS.AUTH.REFRESH),

  // Fallback for the current backend when desktop web is classified as DESKTOP
  // and returns the refresh token in the login response instead of a cookie.
  refreshAccessTokenWithToken: (refreshToken: string) =>
    apiClient.post<ApiEnvelope<AuthResponse>>(
      `${API_ENDPOINTS.AUTH.REFRESH}/mobile`,
      { refreshToken },
    ),

  logout: () => apiClient.post<ApiEnvelope<void>>(API_ENDPOINTS.AUTH.LOGOUT),

  logoutDevice: (body: LogoutDeviceRequest) =>
    apiClient.post<ApiEnvelope<void>>(API_ENDPOINTS.AUTH.LOGOUT_DEVICE, body),

  logoutOtherDevices: () =>
    apiClient.post<ApiEnvelope<void>>(API_ENDPOINTS.AUTH.LOGOUT_OTHER),
};
