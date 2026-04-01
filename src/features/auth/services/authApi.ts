import type {
  ApiEnvelope,
  AuthTokenData,
  LoginRequest,
  RegisterInitRequest,
  VerifyOTPRequest,
  ResendOTPRequest,
  RefreshTokenRequest
} from '../types'

// In development, Vite proxies /api → http://localhost:8060/api (see vite.config.ts)
// In production, set VITE_API_BASE_URL to the real backend URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const APP_VERSION = '1.0.0'

function getDeviceId () {
  let deviceId = localStorage.getItem('x-device-id')
  if (!deviceId) {
    deviceId = `web-${crypto.randomUUID()}`
    localStorage.setItem('x-device-id', deviceId)
  }
  return deviceId
}

function getHeaders (): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Device-ID': getDeviceId()
  }
}

async function handleResponse<T> (res: Response): Promise<ApiEnvelope<T>> {
  const text = await res.text()

  // Handle non-JSON error responses (e.g. CORS, gateway errors)
  let body: ApiEnvelope<T>
  try {
    body = JSON.parse(text)
  } catch {
    throw new Error(text || `Request failed with status ${res.status}`)
  }

  // Only throw on HTTP error status codes
  if (!res.ok) {
    throw new Error(body.message || `Request failed with status ${res.status}`)
  }

  return body
}

// --- Login ---
export async function apiLogin (email: string, password: string): Promise<ApiEnvelope<AuthTokenData>> {
  const payload: LoginRequest = { email, password, appVersion: APP_VERSION }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<AuthTokenData>(res)
}

// --- Register Init ---
export async function apiRegisterInit (email: string, phoneNumber: string, password: string): Promise<ApiEnvelope<string>> {
  const payload: RegisterInitRequest = { email, phoneNumber, password, appVersion: APP_VERSION }

  const res = await fetch(`${BASE_URL}/auth/register/init`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<string>(res)
}

// --- Verify OTP ---
export async function apiVerifyOTP (email: string, otp: string): Promise<ApiEnvelope<AuthTokenData>> {
  const payload: VerifyOTPRequest = { email, otp }

  const res = await fetch(`${BASE_URL}/auth/register/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<AuthTokenData>(res)
}

// --- Resend OTP ---
export async function apiResendOTP (email: string): Promise<ApiEnvelope<null>> {
  const payload: ResendOTPRequest = { email }

  const res = await fetch(`${BASE_URL}/auth/register/resend-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<null>(res)
}

// --- Refresh Token ---
export async function apiRefreshToken (refreshToken: string): Promise<ApiEnvelope<AuthTokenData>> {
  const payload: RefreshTokenRequest = { refreshToken }

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  })

  return handleResponse<AuthTokenData>(res)
}
