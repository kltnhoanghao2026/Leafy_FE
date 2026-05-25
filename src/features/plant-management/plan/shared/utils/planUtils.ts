import type { PlanResponse } from "../../shared/types";

// ── Date Formatting ────────────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined, fallback = "—"): string {
  if (!iso) return fallback;
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return fallback;
  }
}

// ── Plan Label ───────────────────────────────────────────────────────────────────

export function getPlanLabel(plan: PlanResponse): string {
  return plan.planName ?? plan.diseaseName ?? plan.id;
}
