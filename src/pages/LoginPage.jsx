import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const deviceId = "web-" + (navigator.userAgent || "unknown").slice(0, 40);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ username, password, device_id: deviceId });
      navigate("/");
    } catch (err) {
      alert(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      {/* 👇 Forgot Password Link */}
      <div style={{ marginTop: 16 }}>
        <Link to="/otp/request">Forgot your password?</Link>
    </div>

    </div>
  );
}
