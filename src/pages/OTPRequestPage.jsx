// src/pages/OTPRequestPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function OTPRequestPage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("email");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error("Enter email or phone number.");
    setLoading(true);

    try {
      await axios.post("/auth/otp/request/", { identifier, channel });
      toast.info("If an account exists, an OTP was sent.");

      // ✅ Save identifier so it persists
      localStorage.setItem("reset_identifier", identifier);

      // ✅ Redirect to verification page
      navigate("/otp/verify");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to request OTP.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Request OTP</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email or phone</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your email or phone"
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      </form>
    </div>
  );
}
