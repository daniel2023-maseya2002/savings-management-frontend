import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import AuthLayout from "../layouts/AuthLayout";

export default function OTPVerifyPage() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const identifier = localStorage.getItem("reset_identifier");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !otp) return toast.error("Enter the OTP you received.");

    try {
      const res = await axios.post("/auth/otp/verify/", { identifier, otp });
      localStorage.removeItem("reset_identifier");
      const reset_token = res?.data?.reset_token;
      toast.success("OTP verified successfully!");
      navigate("/otp/new-password", { state: { reset_token } });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP.");
    }
  };

  return (
    <AuthLayout
      title="Verify OTP ✉️"
      subtitle="Enter the one-time password sent to your email or phone."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            OTP Code
          </label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter your 6-digit code"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition"
        >
          Verify OTP
        </button>
      </form>

      {/* Back to Login Button */}
      <button
        onClick={() => navigate("/login")}
        className="mt-4 w-full py-2.5 rounded-lg font-semibold text-emerald-400 hover:text-emerald-300 transition"
      >
        ← Back to Login
      </button>
    </AuthLayout>
  );
}
