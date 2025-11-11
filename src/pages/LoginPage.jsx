import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import AuthLayout from "../layouts/AuthLayout";

// Generate or get device ID (persistent)
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for saved credentials if remember me was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    if (savedUsername) {
      setForm(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.username.trim() || !form.password) {
      toast.warning("Please enter both username and password");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await axiosInstance.post("/auth/login/", {
        username: form.username.trim(),
        password: form.password,
        device_id: getDeviceId(),
      });

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("savedUsername", form.username.trim());
      } else {
        localStorage.removeItem("savedUsername");
      }

      // Save the user in context
      login(res.data);
      
      // Success notification
      toast.success("Welcome back! Redirecting you now...", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });

      // Redirect based on role
      setTimeout(() => {
        if (res.data?.is_staff) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }, 1000); // Small delay for better UX

    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      
      if (status === 403 && data?.device_status) {
        toast.warn("Your device is pending admin approval. We'll notify you once approved.");
      } else if (status === 401) {
        toast.error("Invalid username or password. Please try again.");
      } else {
        toast.error(data?.detail || "Connection failed. Please check your internet and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in securely to access your account"
    >
      <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 transition-all duration-300">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            {/* Simple SVG icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-gray-200 text-sm mb-2 block font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Username
            </label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition-all duration-200"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-200 text-sm mb-2 block font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={onChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 outline-none transition-all duration-200 pr-10"
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 rounded border-gray-500 text-emerald-500 focus:ring-emerald-400/50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Remember me
              </label>
            </div>
            <Link 
              to="/otp/request" 
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? "bg-emerald-700/80 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
              Create account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 pt-5 border-t border-slate-700">
          <p className="text-xs text-center text-gray-500">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">Terms of Service</Link>{" "}and{" "}
            <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}