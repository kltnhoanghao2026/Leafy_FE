import type {
  PlanApplyResponse,
  PlanResponse,
  PlanUpdateRequest,
  SourceDocument,
  TreatmentStatus,
} from "../../shared/types";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Ban,
  type ComponentType,
} from "lucide-react";

// ── Card Props ───────────────────────────────────────────────────────────────────

export interface PlanCardProps {
  plan: PlanResponse;
  plantLabel?: string | null;
  plotName?: string | null;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (plan: PlanResponse) => void;
  /** Called when the user clicks "Áp dụng" on a public plan card */
  onApply?: () => void;
  detailUrl: string;
  variant?: "grid" | "list";
  /** When true, renders owner info and hides delete/select controls */
  isPublicView?: boolean;
}

export interface PlanApplyCardProps {
  apply: PlanApplyResponse;
  /** Plan name to display — fetched externally by the parent. */
  planName?: string | null;
  variant?: "grid" | "list";
  onStatusChange?: (applyId: string, status: TreatmentStatus) => void;
  /** Callback to trigger cancel flow. When provided and apply is ACTIVE + canCancel, a cancel button appears. */
  onCancelApply?: (apply: PlanApplyResponse) => void;
}

// ── Modal Props ──────────────────────────────────────────────────────────────────

export interface SourceDocumentModalProps {
  sourceDocument: SourceDocument;
  onClose: () => void;
}

export interface CancelApplyDialogProps {
  apply: PlanApplyResponse;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface EditPlanDialogProps {
  plan: PlanResponse;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: PlanUpdateRequest) => void;
}

// ── Constants ───────────────────────────────────────────────────────────────────

export const SEVERITY_STYLE: Record<string, string> = {
  LOW: "text-blue-700 bg-blue-50 ring-1 ring-blue-200/50 rounded-full px-2 py-0.5",
  MEDIUM: "text-amber-700 bg-amber-50 ring-1 ring-amber-200/50 rounded-full px-2 py-0.5",
  HIGH: "text-red-700 bg-red-50 ring-1 ring-red-200/50 rounded-full px-2 py-0.5",
  CRITICAL: "text-rose-700 bg-rose-50 ring-1 ring-rose-200/50 rounded-full px-2 py-0.5",
};

export const SEVERITY_OPTIONS = ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

// ── Treatment Status Config ────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  ring: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const STATUS_CONFIG: Record<TreatmentStatus, StatusConfig> = {
  PENDING: {
    label: "Chờ xử lý",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    icon: Clock,
  },
  APPLYING: {
    label: "Đang áp dụng",
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-200",
    icon: Play,
  },
  ACTIVE: {
    label: "Đang điều trị",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    icon: Play,
  },
  COMPLETED: {
    label: "Hoàn tất",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "bg-slate-100",
    text: "text-slate-600",
    ring: "ring-slate-200",
    icon: XCircle,
  },
};
