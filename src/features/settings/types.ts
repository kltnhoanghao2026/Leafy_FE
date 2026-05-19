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
  addressLine: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
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
  proofFileId?: string;
  fileType?: string;
  issueDate: string;
  expired: boolean;
}

// --- Profile Update Request (for PUT /profiles/user/{userId}) ---
export interface ProfileUpdateRequest {
  avatar?: string;
  role?: "FARMER" | "EXPERT";
  specialty?: string;
  bio?: string;
  fullName?: string;
  addressLine?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  latitude?: number;
  longitude?: number;
  userPreference?: UserPreferenceUpdateRequest;
}

export interface UserPreferenceUpdateRequest {
  appearanceSettings?: AppearanceSettings;
}

export interface UserPreferenceResponse {
  generalSettings: GeneralSettings;
  privacySettings: PrivacySettings;
  appearanceSettings: AppearanceSettings;
  notificationSettings: NotificationSettings;
}

export interface GeneralSettings {
  showAllFriends: boolean;
  languageEn: boolean;
}

export interface GeneralSettingsUpdateRequest {
  showAllFriends?: boolean;
  languageEn?: boolean;
}

export interface PrivacySettings {
  shareFarmPlotsWithConsultants: boolean;
  sharePlantsWithConsultants: boolean;
  sharePlantEventsWithConsultants: boolean;
  sharePlansWithConsultants: boolean;
}

export interface PrivacySettingsUpdateRequest {
  shareFarmPlotsWithConsultants?: boolean;
  sharePlantsWithConsultants?: boolean;
  sharePlantEventsWithConsultants?: boolean;
  sharePlansWithConsultants?: boolean;
}

export interface AppearanceSettings {
  theme: boolean;
}

export interface AppearanceSettingsUpdateRequest {
  theme: boolean;
}

export interface NotificationSettings {
  notifyNewMessageFromDirect: boolean;
  previewNewMessageFromDirect: boolean;
  notifyNewMessageFromGroup: boolean;
  notifyNewPostFromFriend: boolean;
  notifyNewMessage: boolean;
}

export interface NotificationSettingsUpdateRequest {
  notifyNewMessageFromDirect?: boolean;
  previewNewMessageFromDirect?: boolean;
  notifyNewMessageFromGroup?: boolean;
  notifyNewPostFromFriend?: boolean;
  notifyNewMessage?: boolean;
}

export interface FileResponse {
  id: string;
  s3Key: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
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
