/**
 * Maps backend error messages to Vietnamese UI strings.
 * All hooks consume the mapped result — no error logic in hooks.
 */

const ERROR_MAP: Record<string, string> = {
  // Login
  'Invalid credentials': 'Email hoặc mật khẩu không chính xác',
  'Invalid email or password': 'Email hoặc mật khẩu không chính xác',
  'Account is locked': 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.',
  'Account is disabled': 'Tài khoản đã bị vô hiệu hóa.',
  'Account not verified': 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.',

  // Register
  'Email already exists': 'Email đã được sử dụng',
  'Email already registered': 'Email đã được đăng ký',
  'Phone number already exists': 'Số điện thoại đã được sử dụng',
  'Invalid email format': 'Định dạng email không hợp lệ',
  'Password too weak': 'Mật khẩu quá yếu. Hãy sử dụng ít nhất 6 ký tự.',

  // OTP
  'Invalid OTP': 'Mã OTP không chính xác',
  'OTP expired': 'Mã OTP đã hết hạn. Vui lòng gửi lại.',
  'OTP already verified': 'Mã OTP đã được xác thực trước đó.',
  'Too many OTP requests': 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',

  // Token
  'Token expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Invalid refresh token': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',

  // Generic
  'Internal server error': 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
  'Service unavailable': 'Dịch vụ tạm thời không khả dụng.'
}

const FALLBACK_MESSAGE = 'Đã xảy ra lỗi. Vui lòng thử lại.'

/**
 * Map a backend error (Error or string) to a Vietnamese UI message.
 */
export function mapAuthError (error: unknown): string {
  if (error instanceof Error) {
    // Try exact match first
    if (ERROR_MAP[error.message]) {
      return ERROR_MAP[error.message]
    }

    // Try partial match (backend might return "Invalid credentials: ...")
    for (const [key, value] of Object.entries(ERROR_MAP)) {
      if (error.message.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }

    // If the backend already sends Vietnamese, pass it through
    if (/[\u00C0-\u024F\u1E00-\u1EFF]/.test(error.message)) {
      return error.message
    }

    return FALLBACK_MESSAGE
  }

  if (typeof error === 'string') {
    return ERROR_MAP[error] || FALLBACK_MESSAGE
  }

  return FALLBACK_MESSAGE
}
