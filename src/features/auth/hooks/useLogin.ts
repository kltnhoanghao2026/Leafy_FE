import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useLoginMutation } from "../queries";
import { mapAuthError } from "../services/authErrorMapper";
import type { LoginCredentials } from "../types";
import { ROUTES } from "../../../lib/routes";

const loginSchema = z.object({
  email: z.string().email("Vui lòng nhập email hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export function useLogin() {
  const { setTokens, setRememberMe } = useAuthStore();
  const navigate = useNavigate();
  const mutation = useLoginMutation();

  const login = async (credentials: LoginCredentials, rememberMe: boolean) => {
    // Validate inputs
    const result = loginSchema.safeParse(credentials);
    if (!result.success) {
      return { success: false, error: result.error.issues[0].message };
    }

    try {
      const response = await mutation.mutateAsync({
        email: credentials.email,
        password: credentials.password,
      });

      const envelope = response.data;
      if (envelope.data) {
        setTokens(envelope.data.accessToken);
        setRememberMe(rememberMe);
        navigate(ROUTES.DASHBOARD.ROOT);
        return { success: true };
      }

      return { success: false, error: "Đã xảy ra lỗi khi đăng nhập" };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: mapAuthError(err) };
    }
  };

  return {
    login,
    error: mutation.error ? mapAuthError(mutation.error) : null,
    isPending: mutation.isPending,
  };
}
