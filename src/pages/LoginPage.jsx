import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";

// 🔧 Device ID stays persistent
const getDeviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/login/", {
        username: form.username.trim(),
        password: form.password,
        device_id: getDeviceId(),
      });

      login(res.data);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("🔴 LOGIN ERROR RESPONSE:", err?.response);

      if (status === 403 && data?.device_status) {
        toast.warn("Your device is pending admin approval.");
      } else if (status === 401) {
        toast.error("Invalid username or password.");
      } else if (status === 400) {
        toast.error(data?.detail || "Missing credentials.");
      } else {
        toast.error(data?.detail || "Login failed. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #21c066 0%, #178a47 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          padding: "2.5rem",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontWeight: 700,
            marginBottom: "1.5rem",
            color: "#1e293b",
          }}
        >
          Welcome Back 👋
        </h2>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              Username
            </label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Enter username"
              autoComplete="username"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="Enter password"
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#1e9d56" : "#21c066",
              color: "white",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 14,
          }}
        >
          <Link to="/password-reset" style={{ color: "#21c066" }}>
            Forgot password?
          </Link>
          <Link to="/register" style={{ color: "#21c066" }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
