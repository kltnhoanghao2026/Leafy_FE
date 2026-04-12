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
