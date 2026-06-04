/**
 * Maps device onboarding errors to translated UI strings.
 *
 * Delegates to the central errorMapper for code-based lookup, then applies
 * device-specific message pattern matching for errors that don't carry a
 * structured ApiError code (e.g. legacy or gateway-level messages).
 */

import type { TFunction } from "../../../i18n/context";
import { resolveErrorMessage } from "../../../lib/errorMapper";
import { ApiError } from "../../../lib/apiClient";

const normalizeMessage = (message: string) => message.trim().toLowerCase();

export const mapDeviceOnboardingError = (
  error: unknown,
  t: TFunction,
): string => {
  // For ApiErrors with known codes, the central mapper handles them.
  if (error instanceof ApiError && error.code !== 0) {
    return resolveErrorMessage(error, t);
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";
  const normalized = normalizeMessage(message);

  // Device-specific pattern matching for messages without structured codes.
  if (
    normalized.includes("x-user-id") ||
    normalized.includes("required request header") ||
    normalized.includes("unauthorized") ||
    normalized.includes("session expired") ||
    normalized.includes("please log in again")
  ) {
    return t("iot.devices.onboarding.errorAuth");
  }

  if (
    normalized.includes("device uid already exists") ||
    normalized.includes("device code already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("already exists")
  ) {
    return t("iot.devices.onboarding.errorDuplicate");
  }

  if (
    normalized.includes("claim code has expired") ||
    normalized.includes("expired claim code")
  ) {
    return t("iot.devices.onboarding.errorExpiredClaim");
  }

  if (
    normalized.includes("invalid claim code") ||
    normalized.includes("claim state") ||
    normalized.includes("already claimed")
  ) {
    return t("iot.devices.onboarding.errorInvalidClaim");
  }

  if (normalized.includes("farm") && normalized.includes("zone")) {
    return t("iot.devices.onboarding.errorMissingFarmZone");
  }

  if (normalized.includes("not found")) {
    return t("iot.devices.onboarding.errorNotFound");
  }

  if (normalized.includes("network error")) {
    return t("iot.devices.onboarding.errorNetwork");
  }

  // Fall back to the central mapper for any remaining cases.
  return resolveErrorMessage(error, t);
};
