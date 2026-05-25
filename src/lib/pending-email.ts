const PENDING_EMAIL_KEY = "leafy_pending_verify_email";

export const getPendingEmail = (): string | null => {
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
};

export const setPendingEmailSession = (email: string): void => {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email);
};

export const clearPendingEmail = (): void => {
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
};
