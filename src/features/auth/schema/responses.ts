export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegistrationInitResponse {
  message: string;
  email: string;
  expiresInSeconds: number;
}
