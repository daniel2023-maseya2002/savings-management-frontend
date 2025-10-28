// src/pages/OTPVerifyPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function OTPVerifyPage() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  // ✅ Always get identifier from localStorage
  const identifier = localStorage.getItem("reset_identifier");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !otp) return toast.error("Enter OTP.");

    try {
      const res = await axios.post("/auth/otp/verify/", { identifier, otp });
      const reset_token = res?.data?.reset_token;

      toast.success("OTP verified successfully!");

      // ✅ Clear identifier to keep storage clean
      localStorage.removeItem("reset_identifier");

      // ✅ Redirect to new password page with the token
      navigate("/otp/new-password", { state: { reset_token } });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP.");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Verify OTP</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the OTP you received"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Verify</button>
        </div>
      </form>
    </div>
  );
}
