import { useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  useRegisterStore,
  setPendingEmailSession,
} from "../../../store/registerStore";
import { useInitiateRegistrationMutation } from "../queries";
import { mapAuthError } from "../services/authErrorMapper";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Họ và tên không được để trống"),
    phone: z
      .string()
      .regex(/^(\+84|0)[0-9]{9}$/, "Số điện thoại phải là số điện thoại Việt Nam hợp lệ (09/08/07/05/03 + 9 chữ số)"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn phải đồng ý với điều khoản",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export function useRegisterLogic() {
  const { formData, setFormData, agreedToTerms, setAgreedToTerms } =
    useRegisterStore();
  const navigate = useNavigate();
  const mutation = useInitiateRegistrationMutation();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ [name]: value });
    setError(null);
  };

  const toggleAgreedToTerms = () => {
    setAgreedToTerms(!agreedToTerms);
    setError(null);
  };

  const register = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setError(null);
    setSuccess(null);

    const dataToValidate = {
      ...formData,
      agreedToTerms,
    };

    const result = registerSchema.safeParse(dataToValidate);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return { success: false };
    }

    try {
      await mutation.mutateAsync({
        email: formData.email || "",
        phoneNumber: formData.phone || "",
        fullName: formData.fullName || "",
        password: formData.password || "",
      });

      // Save pending email to sessionStorage and navigate to OTP page
      setPendingEmailSession(formData.email || "");
      setSuccess("Đăng ký thành công! Vui lòng kiểm tra email.");
      navigate("/verify-email");
      return { success: true };
    } catch (err: unknown) {
      console.error("Register error:", err);
      setError(mapAuthError(err));
      return { success: false };
    }
  };

  return {
    formData,
    agreedToTerms,
    handleChange,
    toggleAgreedToTerms,
    register,
    error,
    success,
    isLoading: mutation.isPending,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  };
}
