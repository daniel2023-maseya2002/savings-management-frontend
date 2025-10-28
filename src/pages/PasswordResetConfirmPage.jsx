// src/pages/PasswordResetConfirmPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function PasswordResetConfirmPage() {
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!uid || !token || !newPassword) return toast.error("Fill all fields.");
    setLoading(true);
    try {
      const res = await axios.post("/auth/password-reset-confirm/", { uid, token, new_password: newPassword });
      toast.success(res.data.detail || "Password has been reset successfully.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to reset password.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Password reset confirmation</h2>
      <form onSubmit={submit}>
        <div><label>UID</label><input value={uid} onChange={(e) => setUid(e.target.value)} /></div>
        <div><label>Token</label><input value={token} onChange={(e) => setToken(e.target.value)} /></div>
        <div><label>New password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        <div style={{ marginTop: 12 }}><button disabled={loading}>{loading ? "Processing..." : "Reset Password"}</button></div>
      </form>
    </div>
  );
}
