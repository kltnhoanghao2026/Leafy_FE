export interface LoginRequest {
  email: string;
  password: string;
  appVersion?: string;
}

export interface InitialRegisterRequest {
  email: string;
  phoneNumber: string;
  password: string;
  appVersion?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutDeviceRequest {
  deviceId: string;
}
