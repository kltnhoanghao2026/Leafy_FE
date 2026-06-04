/**
 * Maps backend ApiError codes to i18n translation keys.
 *
 * Code ranges follow the backend common module's ErrorCode enum:
 *   1xxx – Auth / JWT
 *   2xxx – Account / OTP / Validation
 *   3xxx – Community
 *   4xxx – Farm / IoT
 *   5xxx – Messaging
 *   6xxx – Notifications
 *   9xxx – System
 */

import type { TFunction } from "../i18n/context";
import { ApiError } from "./apiClient";

// ---------------------------------------------------------------------------
// Code → i18n key map
// ---------------------------------------------------------------------------

const CODE_TO_KEY: Record<number, string> = {
  // ── Auth / JWT (1xxx) ────────────────────────────────────────────────────
  1001: "errors.auth.unauthenticated",
  1002: "errors.auth.unauthorized",
  1003: "errors.auth.jwtInvalid",
  1004: "errors.auth.jwtExpired",
  1005: "errors.auth.jwtSignatureInvalid",
  1006: "errors.auth.invalidCredentials",
  1007: "errors.auth.deviceIdRequired",
  1008: "errors.auth.deviceMismatch",
  1009: "errors.auth.sessionKicked",
  1010: "errors.auth.tokenRevoked",
  1011: "errors.auth.tokenReplay",
  1012: "errors.auth.rateLimitExceeded",
  1013: "errors.auth.refreshTokenNotFound",
  1014: "errors.auth.refreshTokenInvalid",
  1015: "errors.auth.tokenFamilyRevoked",

  // ── Account (2xxx) ───────────────────────────────────────────────────────
  2001: "errors.acc.phoneAlreadyUsed",
  2002: "errors.acc.emailAlreadyUsed",
  2003: "errors.acc.notFound",
  2004: "errors.acc.userNotFound",
  2005: "errors.acc.fileNotFound",
  2006: "errors.acc.invalidOtp",
  2007: "errors.acc.wrongPassword",
  2008: "errors.acc.isOauth",
  2009: "errors.acc.cicExists",

  // ── OTP (20xx) ───────────────────────────────────────────────────────────
  2010: "errors.otp.cooldown",
  2011: "errors.otp.maxAttempts",
  2012: "errors.otp.expired",
  2013: "errors.otp.invalid",
  2014: "errors.otp.purposeMismatch",
  2015: "errors.otp.notFound",
  2016: "errors.otp.registrationExpired",
  2017: "errors.acc.plantNotFound",
  2018: "errors.acc.speciesNotFound",
  2019: "errors.acc.plantEventNotFound",
  2020: "errors.acc.planNotFound",

  // ── Role / Permission (21xx) ─────────────────────────────────────────────
  2101: "errors.role.notFound",
  2102: "errors.perm.notFound",
  2103: "errors.perm.inUse",

  // ── Validation (22xx) ────────────────────────────────────────────────────
  2200: "errors.validation.error",
  2201: "errors.validation.promotionCodeRequired",
  2202: "errors.validation.invalidStatus",
  2203: "errors.validation.invalidDatePair",
  2204: "errors.validation.invalidYearPair",
  2205: "errors.validation.invalidOperation",
  2206: "errors.validation.invalidPromotionCondition",
  2207: "errors.validation.passwordMismatch",
  2208: "errors.validation.invalidPostType",
  2209: "errors.validation.invalidEventTarget",

  // ── Community (3xxx) ─────────────────────────────────────────────────────
  3001: "errors.community.postNotFound",
  3002: "errors.community.commentNotFound",

  // ── Farm (4xxx) ──────────────────────────────────────────────────────────
  4001: "errors.farm.plotNotFound",
  4002: "errors.farm.zoneNotFound",
  4003: "errors.farm.plotCodeDuplicate",
  4004: "errors.farm.zoneNameDuplicate",

  // ── Messaging (5xxx) ─────────────────────────────────────────────────────
  5001: "errors.messaging.conversationNotFound",
  5002: "errors.messaging.messageNotFound",
  5003: "errors.messaging.notParticipant",
  5004: "errors.messaging.invalidDirectConversation",
  5005: "errors.messaging.onlyGroupOperation",

  // ── Notifications (6xxx) ─────────────────────────────────────────────────
  6001: "errors.notification.pushTokenNotFound",
  6002: "errors.notification.pushDeliveryFailed",
  6003: "errors.notification.emailDeliveryFailed",
  6004: "errors.notification.pushDisabled",

  // ── System (9xxx) ────────────────────────────────────────────────────────
  9999: "errors.sys.uncategorized",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Resolves an unknown error to a display-ready translated string.
 *
 * Resolution order:
 *   1. ApiError with a known code → i18n lookup
 *   2. ApiError with an unknown code but a Vietnamese message → use message as-is
 *   3. Any Error with a message → use message as-is
 *   4. Fallback → generic "errors.sys.uncategorized" translation
 */
export function resolveErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    const key = CODE_TO_KEY[error.code];
    if (key) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const translated = (t as any)(key) as string;
      if (translated && translated !== key) return translated;
    }
    // Fall back to the raw server message if it looks like Vietnamese
    if (error.message && /[\u00C0-\u024F\u1E00-\u1EFF]/.test(error.message)) {
      return error.message;
    }
    if (error.message) return error.message;
  }

  if (error instanceof Error) {
    if (/[\u00C0-\u024F\u1E00-\u1EFF]/.test(error.message)) {
      return error.message;
    }
    if (error.message) return error.message;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (t as any)("errors.sys.uncategorized") as string;
}

/**
 * Extracts the per-field errors map from an ApiError, if present.
 */
export function resolveFieldErrors(
  error: unknown,
): Record<string, string> | undefined {
  return error instanceof ApiError ? error.errors : undefined;
}
