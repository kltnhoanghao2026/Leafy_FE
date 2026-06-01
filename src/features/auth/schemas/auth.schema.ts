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
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
    fullName: z.string().min(1, "Họ và tên không được để trống"),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^(\+84|0)[0-9]{9}$/.test(val),
        "Số điện thoại phải là số điện thoại Việt Nam hợp lệ (09/08/07/05/03 + 9 chữ số)",
      ),
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
