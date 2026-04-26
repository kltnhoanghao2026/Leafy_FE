export type ServiceHealthStatus = "UP" | "DOWN" | "UNKNOWN";
export type OverallHealthStatus = "UP" | "DEGRADED" | "DOWN";

export interface ServiceHealthDto {
  name: string;
  serviceId: string;
  status: ServiceHealthStatus;
  responseTimeMs?: number | null;
  instances: number;
}

export interface SystemHealthResponse {
  overallStatus: OverallHealthStatus;
  totalServices: number;
  upServices: number;
  downServices: number;
  services: ServiceHealthDto[];
  checkedAt: string;
}

// ============================================================================
// User Management
// ============================================================================

export type UserRole = "USER" | "ADMIN";

export interface AdminUserDto {
  id: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  active: boolean;
  createdAt: string;
  lastModifiedAt: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UserListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

// ============================================================================
// Profile Management
// ============================================================================

export type ProfileRole = "FARMER" | "EXPERT";

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

export interface AdminProfileDto {
  id: string;
  userId: string;
  fullName: string | null;
  profilePicture: string | null;
  avatar: string | null;
  role: ProfileRole | null;
  specialty: string | null;
  isVerified: boolean;
  bio: string | null;
  addressLine: string | null;
  provinceCode: string | null;
  active: boolean;
  email: string | null;
  phoneNumber: string | null;
  createdAt: string;
  lastModifiedAt: string;
}

export interface AdminProfileDetailsDto extends AdminProfileDto {
  districtCode: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
  certificates: CertificateDto[];
}

export interface ProfileListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  searchTerm?: string;
  role?: ProfileRole;
  active?: boolean;
  isVerified?: boolean;
}

// ============================================================================
// Certificate / Approval Request
// ============================================================================

export type CertificateApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

/** Subset of profile data embedded in an enriched approval request response. */
export interface ApprovalRequestUserInfo {
  fullName: string | null;
  avatar: string | null;
  profilePicture: string | null;
  role: ProfileRole | null;
  email: string | null;
  isVerified: boolean;
}

/** Raw approval request as returned by the backend API. */
export interface ApprovalRequest {
  id: string;
  profileId: string;
  certificates: CertificateDto[];
  status: CertificateApprovalStatus;
  rejectionReason: string | null;
  proposedSpecialty: string | null;
}

/** Approval request enriched with profile/user info on the frontend. */
export interface ApprovalRequestResponse extends ApprovalRequest {
  userInfo: ApprovalRequestUserInfo | null;
}

/** @deprecated Use ApprovalRequest or ApprovalRequestResponse instead. */
export type ApprovalRequestDto = ApprovalRequestResponse;

export interface UpdateApprovalStatusPayload {
  status: CertificateApprovalStatus;
  reason?: string;
}

// ============================================================================
// Farm Management
// ============================================================================

export type FarmPlotStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type FarmZoneStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface FarmPlotDto {
  id: string;
  ownerProfileId: string;
  name: string;
  code: string;
  description: string | null;
  areaM2: number | null;
  addressLine: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  latitude: number | null;
  longitude: number | null;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmPlotStatus;
  createdAt: string;
  lastModifiedAt: string;
}

export interface FarmZoneDto {
  id: string;
  farmPlotId: string;
  zoneName: string;
  zoneCode: string;
  description: string | null;
  areaM2: number | null;
  soilType: string | null;
  cropType: string | null;
  plantingDate: string | null;
  elevationM: number | null;
  boundaryGeojson: Record<string, unknown> | null;
  status: FarmZoneStatus;
  createdAt: string;
  lastModifiedAt: string;
}

export interface FarmPlotListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  searchTerm?: string;
  status?: FarmPlotStatus;
  provinceCode?: string;
  minAreaM2?: number;
  maxAreaM2?: number;
}

export interface FarmZoneListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
  searchTerm?: string;
  status?: FarmZoneStatus;
  cropType?: string;
  soilType?: string;
  minAreaM2?: number;
  maxAreaM2?: number;
}
