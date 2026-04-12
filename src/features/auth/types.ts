// Re-export schema types for backward compatibility
export type { ApiEnvelope } from "../../shared/types/api";
export type {
  LoginRequest,
  InitialRegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  RefreshTokenRequest,
  LogoutDeviceRequest,
} from "./schema/requests";
export type {
  AuthResponse,
  RegistrationInitResponse,
} from "./schema/responses";

// --- Login ---
export interface LoginCredentials {
  email: string;
  password: string;
}

// --- Register ---
export interface RegisterFormInputs {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

// --- User ---
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}
