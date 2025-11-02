import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import AuthLayout from "../layouts/AuthLayout";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.email || !form.password || !form.confirm_password)
      return toast.error("Please fill in all fields.");

    if (form.password !== form.confirm_password)
      return toast.error("Passwords do not match.");

    setLoading(true);
    try {
      await axios.post("/auth/register/", form);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account ✨"
      subtitle="Join the future of digital banking — it only takes a minute."
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
            placeholder="Choose a username"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Enter your email"
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
            placeholder="Create a password"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
        </div>

        <div>
          <label className="text-gray-200 text-sm mb-2 block font-medium">
            Confirm Password
          </label>
          <input
            name="confirm_password"
            type="password"
            value={form.confirm_password}
            onChange={onChange}
            placeholder="Confirm your password"
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
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <div className="text-center mt-6 text-sm text-emerald-300">
        Already have an account?{" "}
        <Link to="/login" className="underline hover:text-emerald-200">
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
}
