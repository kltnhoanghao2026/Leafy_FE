export interface AuthResponse {
  accessToken: string;
  refreshToken?: string; // Only present for MOBILE clients; WEB uses HttpOnly cookie
  tokenType: string;
  expiresIn: number;
}

export interface RegistrationInitResponse {
  message: string;
  email: string;
  expiresInSeconds: number;
}
