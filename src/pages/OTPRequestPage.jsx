import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import AuthLayout from "../layouts/AuthLayout";

export default function OTPRequestPage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("email");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error("Enter your email or phone number.");

    setLoading(true);
    try {
      await axios.post("/auth/otp/request/", { identifier, channel });
      localStorage.setItem("reset_identifier", identifier);
      toast.info("If an account exists, an OTP was sent.");
      navigate("/otp/verify");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Request One-Time Password 🔐"
      subtitle="Enter your email or phone to receive a secure OTP."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Email or Phone
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or +123456789"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white focus:ring-2 focus:ring-emerald-400 outline-none"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-lg font-semibold text-white transition ${
            loading
              ? "bg-emerald-700 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {loading ? "Sending..." : "Send OTP"}
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
