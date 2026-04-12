// Re-export shared ApiEnvelope for backward compatibility
export type { ApiEnvelope } from "../../shared/types/api";

// --- Profile Response (from GET /profiles/me) ---
export interface ProfileResponse {
  id: string;
  userId: string;
  fullName: string;
  profilePicture: string | null;
  avatar: string | null;
  role: "FARMER" | "EXPERT";
  specialty: string | null;
  certificates: CertificateDto[];
  isVerified: boolean;
  bio: string | null;
  active: boolean;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string;
  lastModifiedAt: string;
}

export interface CertificateDto {
  id: string;
  title: string;
  issuedBy: string;
  proofUrl: string;
  issueDate: string;
  expired: boolean;
}

// --- Profile Update Request (for PUT /profiles/user/{userId}) ---
export interface ProfileUpdateRequest {
  avatar?: string;
  role?: "FARMER" | "EXPERT";
  specialty?: string;
  bio?: string;
}

// --- User Update Request (for PUT /users/{userId} via auth-service) ---
export interface UserUpdateRequest {
  email?: string;
  phoneNumber?: string;
  password?: string;
}

// --- User Response (from auth-service) ---
export interface UserResponse {
  id: string;
  email: string;
  phoneNumber: string;
  role: "USER" | "ADMIN";
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

// --- Role display mapping ---
export const ROLE_LABELS: Record<string, string> = {
  FARMER: "Nông dân",
  EXPERT: "Chuyên gia",
};
