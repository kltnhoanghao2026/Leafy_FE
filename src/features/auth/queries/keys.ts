export const authKeys = {
  all: () => ["auth"] as const,

  login: () => [...authKeys.all(), "login"] as const,

  initiateRegistration: () =>
    [...authKeys.all(), "initiateRegistration"] as const,

  verifyOtpAndRegister: () =>
    [...authKeys.all(), "verifyOtpAndRegister"] as const,

  resendOtp: () => [...authKeys.all(), "resendOtp"] as const,

  refreshAccessToken: () => [...authKeys.all(), "refresh"] as const,

  logout: () => [...authKeys.all(), "logout"] as const,

  logoutDevice: () => [...authKeys.all(), "logoutDevice"] as const,

  logoutOtherDevices: () => [...authKeys.all(), "logoutOtherDevices"] as const,
};
