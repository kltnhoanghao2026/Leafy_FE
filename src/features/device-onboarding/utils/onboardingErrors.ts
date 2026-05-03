const normalizeMessage = (message: string) => message.trim().toLowerCase();

export const mapDeviceOnboardingError = (error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";
  const normalized = normalizeMessage(message);

  if (
    normalized.includes("x-user-id") ||
    normalized.includes("required request header") ||
    normalized.includes("unauthorized") ||
    normalized.includes("session expired") ||
    normalized.includes("please log in again")
  ) {
    return "Phiên đăng nhập đã hết hạn hoặc thiếu thông tin người dùng. Hãy đăng nhập lại rồi thử kết nối thiết bị.";
  }

  if (
    normalized.includes("device uid already exists") ||
    normalized.includes("device code already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("already exists")
  ) {
    return "Thiết bị này đã tồn tại. Hãy kiểm tra lại deviceUid hoặc deviceCode.";
  }

  if (
    normalized.includes("claim code has expired") ||
    normalized.includes("expired claim code")
  ) {
    return "Mã xác thực đã hết hạn. Hãy quét lại QR để lấy claim code mới.";
  }

  if (
    normalized.includes("invalid claim code") ||
    normalized.includes("claim state") ||
    normalized.includes("already claimed")
  ) {
    return "Không thể xác thực thiết bị. Hãy kiểm tra lại claim code hoặc quét lại QR.";
  }

  if (normalized.includes("farm") && normalized.includes("zone")) {
    return "Thiếu farm plot hoặc zone. Hãy chọn đầy đủ vườn và khu vực trước khi kết nối.";
  }

  if (normalized.includes("not found")) {
    return "Không tìm thấy thiết bị hoặc dữ liệu liên quan. Hãy kiểm tra lại thông tin đã nhập.";
  }

  if (normalized.includes("network error")) {
    return "Không thể kết nối tới máy chủ collector. Hãy kiểm tra backend đang chạy.";
  }

  return "Không thể kết nối thiết bị. Hãy kiểm tra dữ liệu nhập vào rồi thử lại.";
};
