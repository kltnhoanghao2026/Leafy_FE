import z from "zod";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginRequestSchema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type TokenResponse = {
  accessToken: string;
  refreshToken?: string;
  refreshTokenExpirationMs?: number;
};

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const registerRequestSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
      ),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), "Số điện thoại không hợp lệ"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export type RegisterInitResponse = {
  message: string;
  email: string;
  expiresInSeconds?: number;
};

// ---------------------------------------------------------------------------
// OTP Verification
// ---------------------------------------------------------------------------

export const verifyOtpRequestSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  otp: z.string().regex(/^[0-9]{6}$/, "OTP phải là 6 chữ số"),
});

export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;

export const resendOtpRequestSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export type ResendOtpRequest = z.infer<typeof resendOtpRequestSchema>;

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

export type RefreshRequest = {
  deviceId?: string;
  refreshToken?: string;
};

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export type LogoutRequest = {
  refreshToken?: string;
};

export type LogoutDeviceRequest = {
  deviceId?: string;
};

// ---------------------------------------------------------------------------
// Legacy type re-exports for backward compatibility
// ---------------------------------------------------------------------------

export type InitialRegisterRequest = RegisterRequest;
export type RegistrationInitResponse = RegisterInitResponse;
