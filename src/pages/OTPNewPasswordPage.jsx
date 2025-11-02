import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import AuthLayout from "../layouts/AuthLayout";

export default function OTPNewPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.reset_token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) return toast.error("Please fill in both fields.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    if (!resetToken) return toast.error("Invalid or missing reset token.");

    try {
      const res = await axios.post("/auth/otp/new-password/", {
        reset_token: resetToken,
        new_password: password,
        confirm_password: confirm,
      });

      toast.success(res?.data?.detail || "Password reset successful!");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to reset password.");
    }
  };

  return (
    <AuthLayout
      title="Set a New Password 🔑"
      subtitle="Your security is our top priority — choose a strong password."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition"
        >
          Save Password
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
