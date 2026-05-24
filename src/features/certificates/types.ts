// ── Certificate application types ──────────────────────────────────────────────

export type CertificateStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";

/** Single certificate entry within an approval request */
export interface CertificateEntry {
  id?: string;
  title: string;
  issuedBy: string;
  /** Full URL or file-service reference for the proof document */
  proofUrl: string;
  /** File-service ID (if uploaded via file service) */
  proofFileId?: string;
  /** MIME type category: PDF | IMAGE | DOCUMENT | OTHER */
  fileType?: string;
  /** Date the certificate was issued */
  issueDate: string; // ISO date string YYYY-MM-DD
}

/** Form model used while the user fills out the wizard */
export interface CertificateFormEntry extends CertificateEntry {
  /** Local file object before upload (not sent to API) */
  file?: File | null;
}

/** Full approval request response (same shape as backend ApprovalRequestDto) */
export interface ApprovalRequestDto {
  id: string;
  profileId: string;
  certificates: CertificateEntry[];
  status: CertificateStatus;
  rejectionReason?: string | null;
  proposedSpecialty?: string | null;
  createdAt?: string;
  lastModifiedAt?: string;
}

/** Payload sent to POST /profiles/{profileId}/approval-requests */
export interface CreateApprovalRequestPayload {
  certificates: Omit<CertificateEntry, "id">[];
  proposedSpecialty?: string;
}

/** Submission state for the wizard */
export interface CertificateWizardState {
  proposedSpecialty: string;
  certificates: CertificateFormEntry[];
}

/** Step metadata for the wizard progress bar */
export interface WizardStep {
  number: number;
  label: string;
  description: string;
}
