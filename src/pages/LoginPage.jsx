import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../layouts/AuthLayout";

// 🔧 Generate or get device ID (persistent)
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

      // Save the user in context
      login(res.data);
      toast.success("Welcome back!");

      // ✅ Redirect based on role
      if (res.data?.is_staff) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 403 && data?.device_status) {
        toast.warn("Your device is pending admin approval.");
      } else if (status === 401) {
        toast.error("Invalid username or password.");
      } else {
        toast.error(data?.detail || "Login failed. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Access your account securely with your credentials."
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Username
          </label>
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Enter username"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Password
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter password"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
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
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="flex justify-between mt-5 text-sm text-emerald-300">
        <Link to="/otp/request">Forgot password?</Link>
        <Link to="/register">Create account</Link>
      </div>
    </AuthLayout>
  );
}
