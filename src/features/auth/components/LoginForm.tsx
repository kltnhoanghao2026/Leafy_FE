import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { ROUTES } from "../../../lib/routes";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const { login, error, isPending } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    await login({ email, password }, rememberMe);
  };

  return (
    <div className="flex flex-col justify-center w-full px-8 py-10 lg:px-16 lg:w-[480px]">
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-[#1a1f2c]">
          Chào mừng bác trở lại!
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Quản lý vườn, thiết bị IoT và cảnh báo trong một nơi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email / Phone Input */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-700"
          >
            Email
          </label>
          <div className="relative text-slate-400 focus-within:text-[#245A34]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="email"
              type="email"
              className="w-full py-3.5 pl-11 pr-4 text-sm border-2 border-slate-100 rounded-2xl outline-none transition-colors focus:border-[#245A34] focus:ring-4 focus:ring-[#245A34]/10 text-slate-800 placeholder:text-slate-400 font-medium"
              placeholder="Nhập email của bác"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-700"
          >
            Mật khẩu
          </label>
          <div className="relative text-slate-400 focus-within:text-[#245A34]">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full py-3.5 pl-11 pr-12 text-sm border-2 border-slate-100 rounded-2xl outline-none transition-colors focus:border-[#245A34] focus:ring-4 focus:ring-[#245A34]/10 text-slate-800 placeholder:text-slate-400 font-medium"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-[#245A34] transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between mt-4">
          <label
            htmlFor="rememberMe"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-5 h-5 border-2 rounded border-slate-200 group-hover:border-[#245A34] transition-colors bg-white">
              <input
                id="rememberMe"
                type="checkbox"
                className="absolute w-full h-full opacity-0 cursor-pointer peer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {rememberMe && (
                <div className="w-2.5 h-2.5 bg-[#245A34] rounded-[2px]" />
              )}
            </div>
            <span className="text-sm font-medium text-slate-600 select-none">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <a
            href="#"
            className="text-sm font-semibold text-[#245A34] hover:text-[#1b432a] transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="relative flex items-center justify-center w-full gap-2 py-3.5 mt-2 text-sm font-bold text-white transition-all bg-[#245A34] rounded-2xl hover:bg-[#1b432a] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#245A34]/30 shadow-lg shadow-[#245A34]/20"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Đăng nhập</span>
              <LogIn className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="mt-8 text-sm font-medium text-center text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          to={ROUTES.AUTH.REGISTER}
          className="font-bold text-[#245A34] hover:text-[#1b432a] transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
