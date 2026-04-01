// --- API Envelope ---
export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T | null
}

// --- Login ---
export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
  appVersion: string
}

// --- Auth Token Response ---
export interface AuthTokenData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

// --- Register ---
export interface RegisterInitRequest {
  email: string
  phoneNumber: string
  password: string
  appVersion: string
}

export interface RegisterFormInputs {
  phone: string
  email: string
  password: string
  confirmPassword: string
  agreedToTerms: boolean
}

export interface VerifyOTPRequest {
  email: string
  otp: string
}

export interface ResendOTPRequest {
  email: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// --- User ---
export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
}
