/**
 * Maps an error from the auth flow to a Vietnamese UI string.
 *
 * Delegates to the central errorMapper (code-based lookup) and falls back
 * to the raw server message when it is already in Vietnamese.
 */

import type { TFunction } from "../../../i18n/context";
import { resolveErrorMessage } from "../../../lib/errorMapper";

export function mapAuthError(error: unknown): string {
  // We don't have a t() function here (no React context), so we use a
  // minimal inline fallback that covers the most common auth codes.
  // Components that have access to useTranslation should prefer useApiError().resolve().
  const fallbackT = (key: string): string => INLINE_TRANSLATIONS[key] ?? key;

  return resolveErrorMessage(error, fallbackT as TFunction);
}

// Inline translations for the most common auth-related error codes.
// These mirror the keys added to vi.ts so the mapper works outside React context.
const INLINE_TRANSLATIONS: Record<string, string> = {
  "errors.auth.unauthenticated": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "errors.auth.unauthorized": "Bạn không có quyền thực hiện thao tác này.",
  "errors.auth.jwtInvalid": "Token không hợp lệ. Vui lòng đăng nhập lại.",
  "errors.auth.jwtExpired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "errors.auth.jwtSignatureInvalid": "Token không hợp lệ. Vui lòng đăng nhập lại.",
  "errors.auth.invalidCredentials": "Email hoặc mật khẩu không chính xác.",
  "errors.auth.deviceIdRequired": "Thiết bị không được nhận dạng. Vui lòng thử lại.",
  "errors.auth.deviceMismatch": "Thiết bị không khớp. Vui lòng đăng nhập lại.",
  "errors.auth.sessionKicked": "Phiên đăng nhập đã bị đăng xuất từ xa.",
  "errors.auth.tokenRevoked": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "errors.auth.tokenReplay": "Phát hiện yêu cầu trùng lặp. Vui lòng đăng nhập lại.",
  "errors.auth.rateLimitExceeded": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  "errors.auth.refreshTokenNotFound": "Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.",
  "errors.auth.refreshTokenInvalid": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  "errors.auth.tokenFamilyRevoked": "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.",
  "errors.acc.phoneAlreadyUsed": "Số điện thoại đã được sử dụng.",
  "errors.acc.emailAlreadyUsed": "Email đã được sử dụng.",
  "errors.acc.notFound": "Tài khoản không tồn tại.",
  "errors.acc.invalidOtp": "Mã OTP không chính xác.",
  "errors.acc.wrongPassword": "Mật khẩu không đúng.",
  "errors.otp.cooldown": "Vui lòng chờ trước khi gửi lại mã OTP.",
  "errors.otp.maxAttempts": "Đã vượt quá số lần thử OTP. Vui lòng thử lại sau.",
  "errors.otp.expired": "Mã OTP đã hết hạn. Vui lòng gửi lại.",
  "errors.otp.invalid": "Mã OTP không chính xác.",
  "errors.otp.registrationExpired": "Dữ liệu đăng ký đã hết hạn. Vui lòng thử lại.",
  "errors.sys.uncategorized": "Đã xảy ra lỗi. Vui lòng thử lại.",
};
