import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  getPendingEmail,
  clearPendingEmail,
} from "../../../store/registerStore";
import { useAuthStore } from "../../../store/authStore";
import {
  useVerifyOtpAndRegisterMutation,
  useResendOtpMutation,
} from "../queries";
import { mapAuthError } from "../services/authErrorMapper";
import { toast } from "react-hot-toast";
import { ROUTES } from "../../../lib/routes";

export function VerifyOTPForm() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();

  const pendingEmail = getPendingEmail();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useVerifyOtpAndRegisterMutation();
  const resendMutation = useResendOtpMutation();

  // If there's no pending email, they shouldn't be here
  if (!pendingEmail) {
    navigate(ROUTES.AUTH.REGISTER);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || verifyMutation.isPending) return;

    setError(null);

    try {
      const response = await verifyMutation.mutateAsync({
        email: pendingEmail,
        otp: otp.trim(),
      });

      const envelope = response.data;
      if (envelope.data) {
        setTokens(envelope.data.accessToken);
        clearPendingEmail();
        toast.success("Xác thực thành công!");
        navigate(ROUTES.DASHBOARD.ROOT);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(mapAuthError(err));
    }
  };

  const handleResendOTP = async () => {
    if (resendMutation.isPending) return;

    setError(null);

    try {
      await resendMutation.mutateAsync({ email: pendingEmail });
      toast.success("Đã gửi lại mã OTP!");
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(mapAuthError(err));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      <button
        onClick={() => navigate(ROUTES.AUTH.REGISTER)}
        className="absolute -top-12 left-0 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#245A34] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        Quay lại
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          Xác thực tài khoản
        </h2>
        <p className="text-[15px] text-gray-500 mt-3 leading-relaxed">
          Vui lòng nhập mã 6 số được gửi đến email{" "}
          <strong className="text-gray-900">{pendingEmail}</strong> để tiếp tục.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div>
          {/* Phase 2: Simple placeholder input. Complex 6-digit in Phase 3. */}
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã OTP..."
            maxLength={6}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#245A34] focus:border-[#245A34] sm:text-lg text-center tracking-widest font-bold transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!otp.trim() || verifyMutation.isPending}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm font-bold text-white bg-[#245A34] hover:bg-[#1b432a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#245A34] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {verifyMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Xác nhận"
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-[14px] text-gray-600 font-medium">
            Chưa nhận được mã?{" "}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendMutation.isPending}
              className="text-[#245A34] hover:text-[#1b432a] font-bold transition-colors disabled:opacity-50"
            >
              {resendMutation.isPending ? "Đang gửi..." : "Gửi lại mã"}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
