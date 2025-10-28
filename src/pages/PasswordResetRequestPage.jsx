// src/pages/PasswordResetRequestPage.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter email");
    setLoading(true);
    try {
      await axios.post("/auth/password-reset/", { email });
      toast.info("If an account exists, an email has been sent with reset instructions.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Request password reset (email)</h2>
      <form onSubmit={submit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset email"}</button>
        </div>
      </form>
    </div>
  );
}
