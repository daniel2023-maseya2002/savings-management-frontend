// src/pages/OTPNewPasswordPage.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function OTPNewPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Token passed from OTPVerifyPage
  const resetToken = location.state?.reset_token;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirm) return toast.error("Please fill both fields.");
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
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Set a New Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Save Password</button>
        </div>
      </form>
    </div>
  );
}
