import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

// 🔧 Utility to get or create device_id
const getDeviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const deviceId = getDeviceId(); // ✅ auto handle device_id

      await axios.post("/auth/register/", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirmPassword, // Django field name
        device_id: deviceId,
      });

      toast.success("Account created! Awaiting admin approval.");
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Registration failed";
      toast.error(msg);

      const fe = {};
      const data = err?.response?.data || {};
      ["username", "email", "password", "confirm_password"].forEach((k) => {
        if (Array.isArray(data[k]) && data[k].length) fe[k] = data[k][0];
      });
      setErrors(fe);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Create your account</h2>

      <form onSubmit={onSubmit}>
        {/* Username */}
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="e.g. dan"
            autoComplete="username"
          />
          {errors.username && <small style={{ color: "red" }}>{errors.username}</small>}
        </label>

        {/* Email */}
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <small style={{ color: "red" }}>{errors.email}</small>}
        </label>

        {/* Password */}
        <label>
          Password
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={onChange}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              style={{ padding: "6px 10px" }}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <small style={{ color: "red" }}>{errors.password}</small>}
        </label>

        {/* Confirm Password */}
        <label>
          Confirm Password
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Re-enter password"
          />
          {errors.confirmPassword && (
            <small style={{ color: "red" }}>{errors.confirmPassword}</small>
          )}
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 16,
            padding: 12,
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
